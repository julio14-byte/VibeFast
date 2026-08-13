import { formatPrecio } from "@/lib/productos"

const STOCK_CRITICO = 2
const STOCK_BAJO = 5

export function getStockStatus(stock) {
  const n = Number(stock) || 0
  if (n === 0) {
    return {
      label: "Agotado",
      badgeClass: "badge-error",
      dotClass: "bg-error",
      level: "critical",
    }
  }
  if (n < STOCK_CRITICO) {
    return {
      label: "Crítico",
      badgeClass: "badge-warning",
      dotClass: "bg-warning",
      level: "critical",
    }
  }
  if (n <= STOCK_BAJO) {
    return {
      label: "Bajo",
      badgeClass: "badge-warning badge-outline",
      dotClass: "bg-warning/70",
      level: "low",
    }
  }
  return {
    label: "En stock",
    badgeClass: "badge-success badge-outline",
    dotClass: "bg-success",
    level: "ok",
  }
}

export function computeDashboardMetrics(productos = []) {
  const totalProductos = productos.length

  let valorInventario = 0
  let alertasCriticas = 0
  let agotados = 0
  const alertasList = []

  for (const p of productos) {
    const stock = Number(p.stock) || 0
    const precio =
      Number(p.precio_publico ?? p.precio ?? 0)
    valorInventario += precio * stock

    const status = getStockStatus(stock)
    if (status.level === "critical") {
      alertasCriticas += 1
      if (stock === 0) agotados += 1
      alertasList.push({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        stock,
        status,
      })
    }
  }

  alertasList.sort((a, b) => a.stock - b.stock)

  return {
    totalProductos,
    valorInventario: round2(valorInventario),
    valorInventarioFmt: formatPrecio(valorInventario),
    alertasCriticas,
    agotados,
    alertasList: alertasList.slice(0, 8),
    stockCriticoThreshold: STOCK_CRITICO,
  }
}

function round2(n) {
  return Math.round(n * 100) / 100
}

/** Construye métricas del dashboard desde stats calculados en servidor. */
export function metricsFromServerStats(stats) {
  const alertasList = (stats.alertasList ?? []).map((p) => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    stock: Number(p.stock) || 0,
    status: getStockStatus(p.stock),
  }))

  return {
    totalProductos: stats.totalProductos ?? 0,
    valorInventario: stats.valorInventario ?? 0,
    valorInventarioFmt: formatPrecio(stats.valorInventario ?? 0),
    alertasCriticas: stats.alertasCriticas ?? 0,
    agotados: stats.agotados ?? 0,
    alertasList,
    stockCriticoThreshold: STOCK_CRITICO,
  }
}
