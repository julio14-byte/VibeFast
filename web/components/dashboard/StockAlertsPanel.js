import Link from "next/link"
import { AlertTriangle, ChevronRight } from "lucide-react"
import { getStockStatus } from "@/lib/dashboard/metrics"

export default function StockAlertsPanel({ alertasList, totalCriticas }) {
  if (!totalCriticas) {
    return (
      <aside
        className="rounded-2xl border border-success/30 bg-success/5 p-4 sm:p-5"
        aria-label="Estado de stock"
      >
        <p className="text-sm font-semibold text-success">Stock saludable</p>
        <p className="mt-1 text-xs text-base-content/60">
          No hay productos en nivel crítico o agotados.
        </p>
      </aside>
    )
  }

  return (
    <aside
      className="rounded-2xl border border-warning/40 bg-warning/5 p-4 sm:p-5"
      aria-label="Alertas de stock crítico"
    >
      <div className="flex items-center gap-2 text-warning">
        <AlertTriangle className="size-5 shrink-0" />
        <h2 className="font-bold text-sm uppercase tracking-wide">
          Stock crítico ({totalCriticas})
        </h2>
      </div>
      <ul className="mt-3 space-y-2">
        {alertasList.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-2 rounded-lg bg-base-100/80 px-3 py-2 text-sm border border-base-200/80"
          >
            <div className="min-w-0">
              <p className="font-medium leading-snug break-words whitespace-normal">
                {item.nombre}
              </p>
              <p className="text-xs text-base-content/55 font-mono">
                Cód. {item.codigo}
              </p>
            </div>
            <span className={`badge badge-sm shrink-0 ${item.status.badgeClass}`}>
              {item.stock} u.
            </span>
          </li>
        ))}
      </ul>
      {totalCriticas > alertasList.length && (
        <p className="mt-2 text-xs text-base-content/50">
          +{totalCriticas - alertasList.length} más en la tabla
        </p>
      )}
      <Link
        href="/productos"
        className="mt-3 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        Reabastecer catálogo
        <ChevronRight className="size-4" />
      </Link>
    </aside>
  )
}
