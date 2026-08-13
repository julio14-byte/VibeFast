import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import config from "@/config"
import { computeDashboardMetrics } from "@/lib/dashboard/metrics"
import {
  computeStockDistribution,
  computeTopValorInventario,
  computeVentasPorDia,
} from "@/lib/dashboard/chartData"
import DashboardView from "@/components/dashboard/DashboardView"

export const metadata = { title: "Dashboard · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  let productos = []
  let ventas = []
  let error = null

  if (!isSupabaseConfigured()) {
    error = "Supabase no está configurado."
  } else {
    try {
      const supabase = await createClient()
      const desde = new Date()
      desde.setDate(desde.getDate() - 7)

      const [productosRes, ventasRes] = await Promise.all([
        supabase
          .from("productos")
          .select("id, codigo, nombre, precio, precio_publico, stock")
          .order("nombre", { ascending: true }),
        supabase
          .from("ventas")
          .select("total, created_at")
          .gte("created_at", desde.toISOString())
          .order("created_at", { ascending: true }),
      ])

      productos = productosRes.data ?? []
      ventas = ventasRes.data ?? []
      error = productosRes.error?.message || ventasRes.error?.message
    } catch (err) {
      error = err.message
    }
  }

  const metrics = computeDashboardMetrics(productos)
  const chartData = {
    ventasChart: computeVentasPorDia(ventas, 7),
    stockDist: computeStockDistribution(productos),
    topValor: computeTopValorInventario(productos, 5),
  }

  if (error) {
    return (
      <div role="alert" className="alert alert-error">
        <span>No pudimos cargar el dashboard: {error}</span>
      </div>
    )
  }

  return (
    <DashboardView
      metrics={metrics}
      productos={productos}
      appName={config.app.name}
      chartData={chartData}
    />
  )
}
