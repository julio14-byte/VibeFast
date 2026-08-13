import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import config from "@/config"
import { computeDashboardMetrics } from "@/lib/dashboard/metrics"
import DashboardView from "@/components/dashboard/DashboardView"

export const metadata = { title: "Dashboard · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  let productos = []
  let error = null

  if (!isSupabaseConfigured()) {
    error = "Supabase no está configurado."
  } else {
    try {
      const supabase = await createClient()
      const { data, error: dbError } = await supabase
        .from("productos")
        .select("id, codigo, nombre, precio, precio_publico, stock")
        .order("nombre", { ascending: true })

      productos = data ?? []
      error = dbError?.message
    } catch (err) {
      error = err.message
    }
  }

  const metrics = computeDashboardMetrics(productos)

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
    />
  )
}
