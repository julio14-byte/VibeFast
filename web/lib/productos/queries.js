import { applyProductSearchFilter, PRODUCT_SELECT } from "./search.js"
import { isDemoProducto } from "./demoCatalog.js"

const DEFAULT_PAGE_SIZE = 50

export async function getProductosPage(
  supabase,
  organizationId,
  { page = 1, perPage = DEFAULT_PAGE_SIZE, query = "" } = {}
) {
  const safePage = Math.max(1, Number(page) || 1)
  const safePerPage = Math.min(100, Math.max(1, Number(perPage) || DEFAULT_PAGE_SIZE))
  const from = (safePage - 1) * safePerPage
  const to = from + safePerPage - 1

  let request = supabase
    .from("productos")
    .select(PRODUCT_SELECT, { count: "exact" })
    .order("nombre", { ascending: true })
    .range(from, to)

  request = applyProductSearchFilter(request, query, organizationId)

  const { data, error, count } = await request

  return {
    productos: data ?? [],
    total: count ?? 0,
    page: safePage,
    perPage: safePerPage,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / safePerPage)),
    error: error?.message ?? null,
  }
}

function isDashboardRpcMissing(error) {
  const msg = error?.message ?? ""
  return (
    error?.code === "42883" ||
    error?.code === "PGRST202" ||
    msg.includes("dashboard_inventario_resumen") ||
    msg.includes("dashboard_top_valor_inventario")
  )
}

async function getDashboardAlertasList(supabase, organizationId) {
  const { data, error } = await supabase
    .from("productos")
    .select("id, codigo, nombre, stock, precio, precio_publico")
    .eq("organization_id", organizationId)
    .lt("stock", 2)
    .order("stock", { ascending: true })
    .limit(8)

  if (error) {
    return { alertasList: [], error: error.message }
  }

  return { alertasList: data ?? [], error: null }
}

/** Resumen de inventario vía RPC (025) o paginación legacy. */
async function getDashboardResumen(supabase, organizationId) {
  const { data, error } = await supabase.rpc("dashboard_inventario_resumen", {
    p_organization_id: organizationId,
  })

  if (!error && data) {
    const dist = data.dist ?? {}
    return {
      totalProductos: data.total_productos ?? 0,
      valorInventario:
        Math.round(Number(data.valor_inventario ?? 0) * 100) / 100,
      alertasCriticas: data.alertas_criticas ?? 0,
      agotados: data.agotados ?? 0,
      dist: {
        ok: dist.ok ?? 0,
        bajo: dist.bajo ?? 0,
        critico: dist.critico ?? 0,
        agotado: dist.agotado ?? 0,
      },
      total: data.total_productos ?? 0,
      error: null,
    }
  }

  if (error && !isDashboardRpcMissing(error)) {
    return { error: error.message }
  }

  return getDashboardResumenLegacy(supabase, organizationId)
}

async function getDashboardResumenLegacy(supabase, organizationId) {
  const dist = { ok: 0, bajo: 0, critico: 0, agotado: 0 }
  let valorInventario = 0
  let agotados = 0
  let total = 0
  const pageSize = 1000
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from("productos")
      .select("stock, precio, precio_publico")
      .eq("organization_id", organizationId)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) return { error: error.message }
    if (!data?.length) break

    for (const p of data) {
      total += 1
      const stock = Number(p.stock) || 0
      const precio = Number(p.precio_publico ?? p.precio ?? 0)
      valorInventario += precio * stock
      if (stock === 0) {
        agotados += 1
        dist.agotado += 1
      } else if (stock < 2) dist.critico += 1
      else if (stock <= 5) dist.bajo += 1
      else dist.ok += 1
    }

    if (data.length < pageSize) break
    from += pageSize
  }

  const { count: alertasCriticas, error: alertasCountError } = await supabase
    .from("productos")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .lt("stock", 2)

  if (alertasCountError) {
    return { error: alertasCountError.message }
  }

  return {
    totalProductos: total,
    valorInventario: Math.round(valorInventario * 100) / 100,
    alertasCriticas: alertasCriticas ?? 0,
    agotados,
    dist,
    total,
    error: null,
  }
}

async function getDashboardTopValor(supabase, organizationId, limit = 5) {
  const { data, error } = await supabase.rpc("dashboard_top_valor_inventario", {
    p_organization_id: organizationId,
    p_limit: limit,
  })

  if (!error) {
    return {
      topValor: (data ?? []).map((p) => ({
        id: p.id,
        nombre: p.nombre,
        codigo: p.codigo,
        stock: Number(p.stock) || 0,
        valor: Number(p.valor) || 0,
      })),
      error: null,
    }
  }

  if (error && !isDashboardRpcMissing(error)) {
    return { topValor: [], error: error.message }
  }

  return getDashboardTopValorLegacy(supabase, organizationId, limit)
}

async function getDashboardTopValorLegacy(supabase, organizationId, limit = 5) {
  let topValor = []
  const pageSize = 1000
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from("productos")
      .select("id, codigo, nombre, stock, precio, precio_publico")
      .eq("organization_id", organizationId)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) return { topValor: [], error: error.message }
    if (!data?.length) break

    for (const p of data) {
      const stock = Number(p.stock) || 0
      const precio = Number(p.precio_publico ?? p.precio ?? 0)
      const valor = precio * stock
      if (valor > 0) {
        topValor.push({
          id: p.id,
          nombre: p.nombre,
          codigo: p.codigo,
          valor,
          stock,
        })
      }
    }

    topValor.sort((a, b) => b.valor - a.valor)
    topValor = topValor.slice(0, limit)

    if (data.length < pageSize) break
    from += pageSize
  }

  return { topValor, error: null }
}

/** Stats + gráficas en una sola pasada (evita RPC duplicado). */
export async function getDashboardInventoryBundle(supabase, organizationId) {
  const [resumen, alertas, top] = await Promise.all([
    getDashboardResumen(supabase, organizationId),
    getDashboardAlertasList(supabase, organizationId),
    getDashboardTopValor(supabase, organizationId),
  ])

  const error = resumen.error || alertas.error || top.error
  if (error) return { error }

  return {
    stats: {
      totalProductos: resumen.totalProductos ?? 0,
      valorInventario: resumen.valorInventario ?? 0,
      alertasCriticas: resumen.alertasCriticas ?? 0,
      agotados: resumen.agotados ?? 0,
      alertasList: alertas.alertasList ?? [],
    },
    chart: {
      dist: resumen.dist ?? { ok: 0, bajo: 0, critico: 0, agotado: 0 },
      topValor: top.topValor ?? [],
      total: resumen.total ?? 0,
    },
    error: null,
  }
}

/** Métricas del dashboard (RPC 025 cuando está aplicada). */
export async function getDashboardProductStats(supabase, organizationId) {
  const [resumen, alertas] = await Promise.all([
    getDashboardResumen(supabase, organizationId),
    getDashboardAlertasList(supabase, organizationId),
  ])

  if (resumen.error) return { error: resumen.error }
  if (alertas.error) return { error: alertas.error }

  return {
    totalProductos: resumen.totalProductos ?? 0,
    valorInventario: resumen.valorInventario ?? 0,
    alertasCriticas: resumen.alertasCriticas ?? 0,
    agotados: resumen.agotados ?? 0,
    alertasList: alertas.alertasList ?? [],
  }
}

/** Datos de gráficas del dashboard (RPC 025 cuando está aplicada). */
export async function getDashboardChartProductData(supabase, organizationId) {
  const [resumen, top] = await Promise.all([
    getDashboardResumen(supabase, organizationId),
    getDashboardTopValor(supabase, organizationId),
  ])

  if (resumen.error) return { error: resumen.error }
  if (top.error) return { error: top.error }

  return {
    dist: resumen.dist ?? { ok: 0, bajo: 0, critico: 0, agotado: 0 },
    topValor: top.topValor ?? [],
    total: resumen.total ?? 0,
  }
}

/** Conteo de productos con stock crítico (< 2). */
export async function getAlertasStockCount(supabase, organizationId) {
  const { count, error } = await supabase
    .from("productos")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .lt("stock", 2)

  return { count: count ?? 0, error: error?.message ?? null }
}

/** Productos de ejemplo (plantilla / pruebas) en la organización. */
export async function getDemoProductos(supabase, organizationId) {
  const { data, error } = await supabase
    .from("productos")
    .select("id, codigo, nombre")
    .eq("organization_id", organizationId)

  if (error) {
    return { demoProductos: [], error: error.message }
  }

  const demoProductos = (data ?? []).filter(isDemoProducto)
  return { demoProductos, error: null }
}

/** Elimina productos demo de la organización (servidor). */
export async function deleteDemoProductosForOrg(supabase, organizationId) {
  const { demoProductos, error: listError } = await getDemoProductos(
    supabase,
    organizationId
  )

  if (listError) {
    return { eliminados: 0, error: listError }
  }

  const ids = demoProductos.map((p) => p.id)
  if (!ids.length) {
    return { eliminados: 0, error: null }
  }

  const { error } = await supabase
    .from("productos")
    .delete()
    .in("id", ids)
    .eq("organization_id", organizationId)

  if (error) {
    return { eliminados: 0, error: error.message }
  }

  return { eliminados: ids.length, error: null }
}

/** Elimina todo el catálogo de la organización. */
export async function deleteAllProductosForOrg(supabase, organizationId) {
  const { count, error: countError } = await supabase
    .from("productos")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)

  if (countError) {
    return { eliminados: 0, error: countError.message }
  }

  const total = count ?? 0
  if (total === 0) {
    return { eliminados: 0, error: null }
  }

  const { error } = await supabase
    .from("productos")
    .delete()
    .eq("organization_id", organizationId)

  if (error) {
    return { eliminados: 0, error: error.message }
  }

  return { eliminados: total, error: null }
}
