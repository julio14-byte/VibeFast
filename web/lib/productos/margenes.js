import { margenDesdePrecioVenta, margenesDesdePrecios } from "@/lib/precios"

export { margenDesdePrecioVenta, margenesDesdePrecios }

/** Márgenes para guardar en BD (0 si no se pueden calcular). */
export function margenesParaPersistir(producto) {
  const { margen_ganancia, margen_mayoreo } = margenesDesdePrecios(producto)
  return {
    margen_ganancia: margen_ganancia ?? 0,
    margen_mayoreo: margen_mayoreo ?? 0,
  }
}

/** Márgenes para mostrar en UI (calculados si hay costo y precio). */
export function margenesParaMostrar(producto) {
  const { margen_ganancia, margen_mayoreo } = margenesDesdePrecios(producto)
  return {
    margenPublico: margen_ganancia,
    margenMayoreo: margen_mayoreo,
  }
}

export function formatMargenPct(margen) {
  if (margen == null || !Number.isFinite(margen)) return "—"
  return `${Number(margen)}%`
}
