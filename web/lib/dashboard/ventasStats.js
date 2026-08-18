import { formatPrecio } from "@/lib/productos"

function round2(n) {
  return Math.round(n * 100) / 100
}

export function summarizeVentasPeriodo(ventas = []) {
  let total = 0
  let count = 0

  for (const venta of ventas) {
    total += Number(venta.total) || 0
    count += 1
  }

  return {
    ventasSemanaTotal: round2(total),
    ventasSemanaCount: count,
    ventasSemanaFmt: formatPrecio(total),
  }
}
