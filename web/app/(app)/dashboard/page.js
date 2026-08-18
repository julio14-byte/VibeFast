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
import { summarizeVentasPeriodo } from "@/lib/dashboard/ventasStats"
import {
  canViewProductMetrics,
  getProductMetrics,
} from "@/lib/dashboard/productMetrics"
import {
  deleteDemoProductosForOrg,
  getDashboardChartProductData,
  getDashboardProductStats,
  getProductosPage,
} from "@/lib/productos/queries"
import { revalidatePath } from "next/cache"
import { getMembershipForUser } from "@/lib/organization/context"

import DashboardView from "@/components/dashboard/DashboardView"

export const metadata = { title: "Dashboard · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function DashboardPage({ searchParams }) {
  let productos = []
  let ventas = []
  let metrics = null
  let chartData = null
  let totalProductos = 0
  let productMetrics = null
  let productMetricsError = null
  let showProductMetrics = false
  let demoEliminados = 0
  let error = null

  const params = await searchParams
  const ok = params?.ok?.toString()
  const demoEliminadosParam = params?.n?.toString()

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

        const membership = await getMembershipForUser(supabase, user.id)
        if (!membership?.organizationId) {
          error = "Sin organización asignada. Cierra sesión y vuelve a entrar."
        } else {
          const organizationId = membership.organizationId

          const demoCleanup = await deleteDemoProductosForOrg(
            supabase,
            organizationId
          )
          if (demoCleanup.error) {
            error = demoCleanup.error
          } else {
            demoEliminados = demoCleanup.eliminados ?? 0
            if (demoEliminados > 0) {
              revalidatePath("/dashboard")
              revalidatePath("/productos")
              revalidatePath("/inventario")
              revalidatePath("/precios")
            }
          }

          if (!error) {
            const desde = new Date()
            desde.setDate(desde.getDate() - 7)

            const [stats, chartProducts, tablePage, ventasRes, metricsRes] =
              await Promise.all([
                getDashboardProductStats(supabase, organizationId),
                getDashboardChartProductData(supabase, organizationId),
                getProductosPage(supabase, organizationId, {
                  page: 1,
                  perPage: 50,
                }),
                supabase
                  .from("ventas")
                  .select("total, created_at")
                  .eq("organization_id", organizationId)
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
              const ventasStats = summarizeVentasPeriodo(ventasRes.data ?? [])
              metrics = {
                ...metricsFromServerStats(stats),
                ...ventasStats,
              }
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

  let okMessage = null
  if (ok === "demo_eliminado") {
    okMessage = `Se eliminaron ${demoEliminadosParam ?? 0} productos de ejemplo.`
  } else if (demoEliminados > 0) {
    okMessage = `Se eliminaron ${demoEliminados} productos de ejemplo de la plantilla inicial.`
  }

  return (
    <DashboardView
      metrics={metrics}
      productMetrics={productMetrics}
      productMetricsError={productMetricsError}
      showProductMetrics={showProductMetrics}
      productos={productos}
      totalProductos={totalProductos}
      okMessage={okMessage}
      appName={config.app.name}
      chartData={chartData}
    />
  )
}
