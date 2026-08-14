import { Bot, Mail, Users } from "lucide-react"
import KpiCard from "./KpiCard"
import { formatWeekTrend } from "@/lib/dashboard/productMetrics"

export default function ProductMetricsKpis({ productMetrics, error }) {
  if (error) {
    return (
      <section aria-label="Métricas de tu producto">
        <div className="rounded-2xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-base-content/75">
          <p className="font-semibold text-base-content">Métricas de tu producto</p>
          <p className="mt-1">
            No pudimos leer waitlist, signups ni chat: {error}. Configura{" "}
            <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> en el servidor.
          </p>
        </div>
      </section>
    )
  }

  if (!productMetrics) return null

  const {
    waitlistTotal,
    waitlistWeek,
    signupsTotal,
    signupsWeek,
    chatSessionsTotal,
    chatSessionsWeek,
  } = productMetrics

  return (
    <section aria-label="Métricas de tu producto" className="space-y-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Tracción del MVP
        </p>
        <h2 className="text-lg font-bold text-base-content sm:text-xl">
          Métricas reales de tu producto
        </h2>
        <p className="mt-1 text-sm text-base-content/60">
          Datos vivos de Supabase para tu pitch: waitlist, registros y sesiones de chat IA.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          title="Waitlist"
          value={waitlistTotal}
          subtitle="Personas que pidieron acceso en la landing"
          trend={formatWeekTrend(waitlistWeek)}
          icon={Mail}
          accent="amber"
        />
        <KpiCard
          title="Signups del MVP"
          value={signupsTotal}
          subtitle="Usuarios registrados en la app"
          trend={formatWeekTrend(signupsWeek)}
          icon={Users}
          accent="steel"
        />
        <KpiCard
          title="Sesiones de chat IA"
          value={chatSessionsTotal}
          subtitle="Conversaciones guardadas (chat + asistente)"
          trend={formatWeekTrend(chatSessionsWeek)}
          icon={Bot}
          accent="success"
        />
      </div>
    </section>
  )
}
