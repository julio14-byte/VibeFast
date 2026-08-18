/** IVA México (16%). Precios público/mayoreo en catálogo incluyen IVA; compra es sin IVA. */

export const IVA_RATE = 0.16

export function round2(n) {
  return Math.round(Number(n) * 100) / 100
}

/** Precio sin IVA desde costo + margen % sobre costo. */
export function precioSinIvaDesdeCompra(compraSinIva, margenPct) {
  const compra = Number(compraSinIva) || 0
  const margen = Number(margenPct) || 0
  return round2(compra * (1 + margen / 100))
}

/** Precio con IVA incluido desde base sin IVA. */
export function precioConIvaDesdeSinIva(sinIva) {
  return round2((Number(sinIva) || 0) * (1 + IVA_RATE))
}

/** Calcula precio de venta con IVA desde compra sin IVA y margen %. */
export function precioVentaConIva(compraSinIva, margenPct) {
  return precioConIvaDesdeSinIva(precioSinIvaDesdeCompra(compraSinIva, margenPct))
}

/**
 * Margen % sobre costo sin IVA, a partir de un precio de venta con IVA incluido.
 * Inverso de precioVentaConIva. Retorna null si no hay costo o precio válido.
 */
export function margenDesdePrecioVenta(compraSinIva, precioConIva) {
  const compra = Number(compraSinIva) || 0
  const venta = Number(precioConIva) || 0
  if (compra <= 0 || venta <= 0) return null

  const sinIva = venta / (1 + IVA_RATE)
  return round2((sinIva / compra - 1) * 100)
}

/** Márgenes menudeo y mayoreo calculados desde costo y precios con IVA. */
export function margenesDesdePrecios({
  precio_compra,
  precio_publico,
  precio_mayoreo,
  precio,
}) {
  const compra = Number(precio_compra) || 0
  const publico = Number(precio_publico ?? precio) || 0
  const mayoreo = Number(precio_mayoreo) || 0

  return {
    margen_ganancia: margenDesdePrecioVenta(compra, publico),
    margen_mayoreo: margenDesdePrecioVenta(compra, mayoreo),
  }
}

/** Desglosa un precio con IVA en base + IVA. */
export function desglosarPrecioConIva(precioConIva) {
  const total = round2(precioConIva)
  const base = round2(total / (1 + IVA_RATE))
  const iva = round2(total - base)
  return { base, iva, total }
}

/** Totales de venta cuando precio_unitario ya incluye IVA. */
export function calcularTotalesPreciosConIva(items) {
  let total = 0
  for (const item of items) {
    const qty = Number(item.cantidad) || 0
    const unit = Number(item.precio_unitario ?? item.precio) || 0
    total += qty * unit
  }
  total = round2(total)
  const subtotal = round2(total / (1 + IVA_RATE))
  const iva = round2(total - subtotal)
  return { subtotal, iva, total }
}
