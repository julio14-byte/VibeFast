/**
 * Búsqueda de productos en Supabase (server-side).
 * Nombre: prefijo (tubo*) y también contiene (ilike %tubo%).
 * Código: exacto, prefijo o contiene.
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

/** Cláusulas OR: nombre (prefijo + contiene) y código. */
function orClausesForTerm(term) {
  const safe = escapeFilterValue(term)
  if (!safe) return []

  const clauses = []
  for (const v of termVariants(safe)) {
    clauses.push(`nombre.ilike.${v}%`)
    clauses.push(`nombre.ilike.%${v}%`)
  }

  clauses.push(`codigo.eq.${safe}`)
  clauses.push(`codigo.ilike.${safe}%`)
  if (safe.length >= 2) {
    clauses.push(`codigo.ilike.%${safe}%`)
  }

  return clauses
}

const PRODUCT_SELECT =
  "id, codigo, nombre, stock, precio, precio_compra, precio_mayoreo, precio_publico, margen_ganancia, margen_mayoreo, clave_sat, unidad_sat"

/**
 * Aplica filtros de texto a un query builder de productos.
 */
export function applyProductSearchFilter(builder, query, organizationId) {
  let request = builder.eq("organization_id", organizationId)

  const q = query?.trim()
  if (!q) return request

  const terms = q.split(/\s+/).filter(Boolean)
  terms.forEach((term, index) => {
    const clauses = orClausesForTerm(term, { namePrefix: index === 0 })
    if (clauses.length) {
      request = request.or(clauses.join(","))
    }
  })

  return request
}

export async function searchProductos(
  supabase,
  organizationId,
  { query = "", limit = 12, offset = 0 } = {}
) {
  const q = query?.trim()

  let request = supabase
    .from("productos")
    .select(PRODUCT_SELECT, { count: "exact" })
    .order("nombre", { ascending: true })
    .range(offset, offset + limit - 1)

  request = applyProductSearchFilter(request, q, organizationId)

  const { data, error, count } = await request
  return { productos: data ?? [], total: count ?? 0, error }
}

export { PRODUCT_SELECT }
