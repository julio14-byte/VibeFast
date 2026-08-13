/**
 * Búsqueda de productos en Supabase (server-side).
 * Reutilizado por API, inventario y tools.
 */

function termVariants(term) {
  const t = term.toLowerCase()
  const variants = new Set([t])
  if (t.length > 3 && t.endsWith("s")) variants.add(t.slice(0, -1))
  if (t.length > 4 && t.endsWith("es")) variants.add(t.slice(0, -2))
  return [...variants]
}

function escapeFilterValue(value) {
  return value.replace(/[%_,.()]/g, "")
}

const PRODUCT_SELECT =
  "id, codigo, nombre, stock, precio, precio_compra, precio_mayoreo, precio_publico, proveedor_id, clave_sat, unidad_sat, proveedor:proveedores(id, nombre)"

/**
 * Aplica filtros de texto a un query builder de productos.
 */
export function applyProductSearchFilter(builder, query, userId) {
  let request = builder.eq("user_id", userId)

  const q = query?.trim()
  if (!q) return request

  const codigoNum = Number.parseInt(q, 10)
  const porCodigoExacto = !Number.isNaN(codigoNum) && String(codigoNum) === q

  if (porCodigoExacto) {
    return request.or(`nombre.ilike.%${escapeFilterValue(q)}%,codigo.eq.${codigoNum}`)
  }

  const terms = q.split(/\s+/).filter(Boolean)
  for (const term of terms) {
    const safe = escapeFilterValue(term)
    if (!safe) continue

    const asCodigo = Number.parseInt(term, 10)
    if (!Number.isNaN(asCodigo) && String(asCodigo) === term) {
      request = request.or(`nombre.ilike.%${safe}%,codigo.eq.${asCodigo}`)
    } else {
      const variants = termVariants(safe)
      const orClause = variants.map((v) => `nombre.ilike.%${v}%`).join(",")
      request = request.or(`${orClause},codigo.ilike.%${safe}%`)
    }
  }

  return request
}

export async function searchProductos(supabase, userId, { query = "", limit = 12, offset = 0 } = {}) {
  const q = query?.trim()

  let request = supabase
    .from("productos")
    .select(PRODUCT_SELECT, { count: "exact" })
    .order("nombre", { ascending: true })
    .range(offset, offset + limit - 1)

  request = applyProductSearchFilter(request, q, userId)

  const { data, error, count } = await request
  return { productos: data ?? [], total: count ?? 0, error }
}

export { PRODUCT_SELECT }
