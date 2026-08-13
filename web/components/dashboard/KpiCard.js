import { LucideIcon } from "lucide-react"

export default function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = "amber",
  trend,
}) {
  const accents = {
    amber: {
      ring: "ring-primary/20",
      icon: "bg-primary/15 text-primary",
      glow: "from-primary/10 to-transparent",
      bar: "bg-primary",
    },
    steel: {
      ring: "ring-neutral/20",
      icon: "bg-neutral/10 text-neutral",
      glow: "from-neutral/10 to-transparent",
      bar: "bg-neutral",
    },
    danger: {
      ring: "ring-error/25",
      icon: "bg-error/15 text-error",
      glow: "from-error/10 to-transparent",
      bar: "bg-error",
    },
    success: {
      ring: "ring-success/25",
      icon: "bg-success/15 text-success",
      glow: "from-success/10 to-transparent",
      bar: "bg-success",
    },
  }

  const a = accents[accent] ?? accents.amber

  return (
    <article
      className={`dashboard-kpi group relative overflow-hidden rounded-2xl border border-base-300/80 bg-base-100 p-5 shadow-sm ring-1 ${a.ring} transition hover:shadow-md`}
    >
      <div
        className={`pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-gradient-to-br ${a.glow} opacity-80`}
      />
      <div className={`absolute left-0 top-0 h-1 w-full ${a.bar} opacity-80`} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-base-content/55">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-base-content">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-base-content/60">{subtitle}</p>
          )}
          {trend && (
            <p className="mt-2 text-xs font-medium text-base-content/50">
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${a.icon}`}
          >
            <Icon className="size-5" strokeWidth={2.25} />
          </div>
        )}
      </div>
    </article>
  )
}
