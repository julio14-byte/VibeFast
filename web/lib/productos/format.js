/**
 * Formato consistente de producto para APIs, MCP y herramientas del agente.
 */
export function mapProductoRow(p) {
  if (!p) return null
  return {
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    descripcion: p.nombre,
    stock: p.stock,
    precio_compra: p.precio_compra,
    precio_mayoreo: p.precio_mayoreo,
    precio_publico: p.precio_publico ?? p.precio,
    margen_ganancia: p.margen_ganancia,
    clave_sat: p.clave_sat ?? null,
    unidad_sat: p.unidad_sat ?? null,
  }
}

export function mapProductoRows(rows) {
  return (rows ?? []).map(mapProductoRow).filter(Boolean)
}
