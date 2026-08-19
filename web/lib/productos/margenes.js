import { margenDesdePrecioVenta, margenesDesdePrecios, round2 } from "@/lib/precios"

export { margenDesdePrecioVenta, margenesDesdePrecios }

/** Margen % con 2 decimales (columnas numeric(10,2) en Supabase). */
export function roundMargenPct(value) {
  if (value == null || !Number.isFinite(Number(value))) return null
  return round2(Number(value))
}

/** Márgenes para guardar en BD (0 si no se pueden calcular). */
export function margenesParaPersistir(producto) {
  const { margen_ganancia, margen_mayoreo } = margenesDesdePrecios(producto)
  return {
    margen_ganancia: roundMargenPct(margen_ganancia) ?? 0,
    margen_mayoreo: roundMargenPct(margen_mayoreo) ?? 0,
  }
}

/** Márgenes para mostrar en UI (calculados si hay costo y precio). */
export function margenesParaMostrar(producto) {
  const { margen_ganancia, margen_mayoreo } = margenesDesdePrecios(producto)
  return {
    margenPublico: roundMargenPct(margen_ganancia),
    margenMayoreo: roundMargenPct(margen_mayoreo),
  }
}

export function formatMargenPct(margen) {
  const n = roundMargenPct(margen)
  if (n == null) return "—"
  return `${n}%`
}
