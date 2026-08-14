import { applyProductSearchFilter, PRODUCT_SELECT } from "./search.js"

const DEFAULT_PAGE_SIZE = 50

export async function getProductosPage(
  supabase,
  userId,
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

  request = applyProductSearchFilter(request, query, userId)

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

/** Métricas del dashboard sin cargar el catálogo completo en memoria. */
export async function getDashboardProductStats(supabase, userId) {
  const { count: totalProductos, error: countError } = await supabase
    .from("productos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)

  if (countError) {
    return { error: countError.message }
  }

  const { data: alertasList, error: alertasError } = await supabase
    .from("productos")
    .select("id, codigo, nombre, stock, precio, precio_publico")
    .eq("user_id", userId)
    .lt("stock", 2)
    .order("stock", { ascending: true })
    .limit(8)

  if (alertasError) {
    return { error: alertasError.message }
  }

  let valorInventario = 0
  let agotados = 0
  const pageSize = 1000
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from("productos")
      .select("stock, precio, precio_publico")
      .eq("user_id", userId)
      .range(from, from + pageSize - 1)

    if (error) {
      return { error: error.message }
    }

    if (!data?.length) break

    for (const p of data) {
      const stock = Number(p.stock) || 0
      const precio = Number(p.precio_publico ?? p.precio ?? 0)
      valorInventario += precio * stock
      if (stock === 0) agotados += 1
    }

    if (data.length < pageSize) break
    from += pageSize
  }

  const { count: alertasCriticas, error: alertasCountError } = await supabase
    .from("productos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .lt("stock", 2)

  if (alertasCountError) {
    return { error: alertasCountError.message }
  }

  return {
    totalProductos: totalProductos ?? 0,
    valorInventario: Math.round(valorInventario * 100) / 100,
    alertasCriticas: alertasCriticas ?? 0,
    agotados,
    alertasList: alertasList ?? [],
  }
}

/** Métricas + datos de gráficas sin cargar todo el catálogo en una sola petición. */
export async function getDashboardChartProductData(supabase, userId) {
  const dist = { ok: 0, bajo: 0, critico: 0, agotado: 0 }
  let topValor = []
  let total = 0
  const pageSize = 1000
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from("productos")
      .select("id, codigo, nombre, stock, precio, precio_publico")
      .eq("user_id", userId)
      .range(from, from + pageSize - 1)

    if (error) return { error: error.message }
    if (!data?.length) break

    for (const p of data) {
      total += 1
      const stock = Number(p.stock) || 0
      if (stock === 0) dist.agotado += 1
      else if (stock < 2) dist.critico += 1
      else if (stock <= 5) dist.bajo += 1
      else dist.ok += 1

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
    topValor = topValor.slice(0, 5)

    if (data.length < pageSize) break
    from += pageSize
  }

  return { dist, topValor, total }
}

/** Conteo de productos con stock crítico (< 2). */
export async function getAlertasStockCount(supabase, userId) {
  const { count, error } = await supabase
    .from("productos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .lt("stock", 2)

  return { count: count ?? 0, error: error?.message ?? null }
}
