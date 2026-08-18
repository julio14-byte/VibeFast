/**
 * Búsqueda de productos en Supabase (server-side).
 * Busca por nombre (ilike) o código (exacto / prefijo vía codigo_text).
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

/** Cláusulas OR para un term: nombre + código (exacto o prefijo numérico). */
function orClausesForTerm(term) {
  const safe = escapeFilterValue(term)
  if (!safe) return []

  const clauses = []
  for (const v of termVariants(safe)) {
    clauses.push(`nombre.ilike.%${v}%`)
  }

  const asCodigo = Number.parseInt(term, 10)
  if (!Number.isNaN(asCodigo) && String(asCodigo) === term.trim()) {
    clauses.push(`codigo.eq.${asCodigo}`)
  }

  // Prefijo de código (ej. "12" → 120, 1205…) — requiere migración 014 (codigo_text)
  if (/^\d+$/.test(safe)) {
    clauses.push(`codigo_text.ilike.%${safe}%`)
  }

  return clauses
}

const PRODUCT_SELECT =
  "id, codigo, nombre, stock, precio, precio_compra, precio_mayoreo, precio_publico, margen_ganancia, margen_mayoreo, clave_sat, unidad_sat"

/**
 * Aplica filtros de texto a un query builder de productos.
 */
export function applyProductSearchFilter(builder, query, userId) {
  let request = builder.eq("user_id", userId)

  const q = query?.trim()
  if (!q) return request

  const terms = q.split(/\s+/).filter(Boolean)
  for (const term of terms) {
    const clauses = orClausesForTerm(term)
    if (clauses.length) {
      request = request.or(clauses.join(","))
    }
  }

  return request
}

export async function searchProductos(
  supabase,
  userId,
  { query = "", limit = 12, offset = 0 } = {}
) {
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
