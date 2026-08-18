import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import config from "@/config"
import {
  clockSkewUserMessage,
  getAuthenticatedUser,
  isJwtClockSkewError,
} from "@/lib/supabase/authSession"
import { metricsFromServerStats } from "@/lib/dashboard/metrics"
import {
  computeVentasPorDia,
  stockDistributionFromCounts,
} from "@/lib/dashboard/chartData"
import {
  canViewProductMetrics,
  getProductMetrics,
} from "@/lib/dashboard/productMetrics"
import {
  getDashboardChartProductData,
  getDashboardProductStats,
  getProductosPage,
} from "@/lib/productos/queries"
import { getMembershipForUser } from "@/lib/organization/context"

import DashboardView from "@/components/dashboard/DashboardView"

export const metadata = { title: "Dashboard · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  let productos = []
  let ventas = []
  let metrics = null
  let chartData = null
  let totalProductos = 0
  let productMetrics = null
  let productMetricsError = null
  let showProductMetrics = false
  let error = null

  if (!isSupabaseConfigured()) {
    error = "Supabase no está configurado."
  } else {
    try {
      const supabase = await createClient()
      const { user, error: authError } = await getAuthenticatedUser(supabase)

      if (!user) {
        error = isJwtClockSkewError(authError)
          ? clockSkewUserMessage()
          : authError || "No autenticado."
      } else {
        showProductMetrics = canViewProductMetrics(user)

        const desde = new Date()
        desde.setDate(desde.getDate() - 7)

        const membership = await getMembershipForUser(supabase, user.id)
        const organizationId = membership?.organizationId ?? user.id

        const [stats, chartProducts, tablePage, ventasRes, metricsRes] =
          await Promise.all([
            getDashboardProductStats(supabase, organizationId),
            getDashboardChartProductData(supabase, organizationId),
            getProductosPage(supabase, organizationId, { page: 1, perPage: 50 }),
            supabase
              .from("ventas")
              .select("total, created_at")
              .gte("created_at", desde.toISOString())
              .order("created_at", { ascending: true }),
            showProductMetrics ? getProductMetrics() : Promise.resolve(null),
          ])

        error =
          stats.error ||
          chartProducts.error ||
          tablePage.error ||
          ventasRes.error?.message

        if (isJwtClockSkewError(error)) {
          error = clockSkewUserMessage()
        }

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

          if (showProductMetrics && metricsRes) {
            if (metricsRes.error) {
              productMetricsError = metricsRes.error
            } else {
              productMetrics = metricsRes
            }
          }
        }
      }
    } catch (err) {
      error = isJwtClockSkewError(err?.message)
        ? clockSkewUserMessage()
        : err.message
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
      productMetrics={productMetrics}
      productMetricsError={productMetricsError}
      showProductMetrics={showProductMetrics}
      productos={productos}
      totalProductos={totalProductos}
      appName={config.app.name}
      chartData={chartData}
    />
  )
}
