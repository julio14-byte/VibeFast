import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import config from "@/config"
import { metricsFromServerStats } from "@/lib/dashboard/metrics"
import {
  computeVentasPorDia,
  stockDistributionFromCounts,
} from "@/lib/dashboard/chartData"
import {
  getDashboardChartProductData,
  getDashboardProductStats,
  getProductosPage,
} from "@/lib/productos/queries"
import DashboardView from "@/components/dashboard/DashboardView"

export const metadata = { title: "Dashboard · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  let productos = []
  let ventas = []
  let metrics = null
  let chartData = null
  let totalProductos = 0
  let error = null

  if (!isSupabaseConfigured()) {
    error = "Supabase no está configurado."
  } else {
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        error = "No autenticado."
      } else {
        const desde = new Date()
        desde.setDate(desde.getDate() - 7)

        const [stats, chartProducts, tablePage, ventasRes] = await Promise.all([
          getDashboardProductStats(supabase, user.id),
          getDashboardChartProductData(supabase, user.id),
          getProductosPage(supabase, user.id, { page: 1, perPage: 50 }),
          supabase
            .from("ventas")
            .select("total, created_at")
            .gte("created_at", desde.toISOString())
            .order("created_at", { ascending: true }),
        ])

        error =
          stats.error ||
          chartProducts.error ||
          tablePage.error ||
          ventasRes.error?.message

        if (!error) {
          metrics = metricsFromServerStats(stats)
          totalProductos = stats.totalProductos ?? 0
          productos = tablePage.productos
          ventas = ventasRes.data ?? []
          chartData = {
            ventasChart: computeVentasPorDia(ventas, 7),
            stockDist: stockDistributionFromCounts(
              chartProducts.dist,
              chartProducts.total
            ),
            topValor: chartProducts.topValor,
          }
        }
      }
    } catch (err) {
      error = err.message
    }
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
      totalProductos={totalProductos}
      appName={config.app.name}
      chartData={chartData}
    />
  )
}
