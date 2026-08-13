import { formatPrecio } from "@/lib/productos"
import { getStockStatus } from "./metrics"

const STOCK_BAJO = 5
const STOCK_CRITICO = 2

export function computeStockDistribution(productos = []) {
  const dist = { ok: 0, bajo: 0, critico: 0, agotado: 0 }

  for (const p of productos) {
    const stock = Number(p.stock) || 0
    if (stock === 0) dist.agotado += 1
    else if (stock < STOCK_CRITICO) dist.critico += 1
    else if (stock <= STOCK_BAJO) dist.bajo += 1
    else dist.ok += 1
  }

  return stockDistributionFromCounts(dist, productos.length)
}

export function stockDistributionFromCounts(dist, total) {
  const safeTotal = total || 1
  return {
    ...dist,
    total,
    segments: [
      { key: "ok", label: "En stock", count: dist.ok, color: "bg-success" },
      { key: "bajo", label: "Bajo", count: dist.bajo, color: "bg-warning/70" },
      { key: "critico", label: "Crítico", count: dist.critico, color: "bg-warning" },
      { key: "agotado", label: "Agotado", count: dist.agotado, color: "bg-error" },
    ].filter((s) => s.count > 0),
    pct: {
      ok: Math.round((dist.ok / safeTotal) * 100),
      bajo: Math.round((dist.bajo / safeTotal) * 100),
      critico: Math.round((dist.critico / safeTotal) * 100),
      agotado: Math.round((dist.agotado / safeTotal) * 100),
    },
  }
}

export function computeTopValorInventario(productos = [], limit = 5) {
  return [...productos]
    .map((p) => {
      const precio = Number(p.precio_publico ?? p.precio ?? 0)
      const stock = Number(p.stock) || 0
      return {
        id: p.id,
        nombre: p.nombre,
        codigo: p.codigo,
        valor: precio * stock,
        stock,
      }
    })
    .filter((p) => p.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, limit)
}

export function computeVentasPorDia(ventas = [], days = 7) {
  const labels = []
  const byDate = new Map()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" })
    labels.push({ key, label })
    byDate.set(key, { total: 0, count: 0 })
  }

  for (const v of ventas) {
    const key = new Date(v.created_at).toISOString().slice(0, 10)
    if (!byDate.has(key)) continue
    const row = byDate.get(key)
    row.total += Number(v.total) || 0
    row.count += 1
  }

  const series = labels.map(({ key, label }) => ({
    key,
    label,
    total: round2(byDate.get(key).total),
    count: byDate.get(key).count,
  }))

  const maxTotal = Math.max(...series.map((s) => s.total), 1)

  return { series, maxTotal, days }
}

function round2(n) {
  return Math.round(n * 100) / 100
}

export function formatChartCurrency(n) {
  if (n >= 1000) {
    return new Intl.NumberFormat("es-MX", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n)
  }
  return formatPrecio(n)
}
