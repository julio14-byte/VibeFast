import { formatPrecio } from "@/lib/productos"
import { formatChartCurrency } from "@/lib/dashboard/chartData"

function BarChart({ title, subtitle, children }) {
  return (
    <article className="rounded-2xl border border-base-300/80 bg-base-100 p-4 shadow-sm">
      <h3 className="text-sm font-bold tracking-tight">{title}</h3>
      {subtitle && (
        <p className="mt-0.5 text-xs text-base-content/55">{subtitle}</p>
      )}
      <div className="mt-4">{children}</div>
    </article>
  )
}

export default function DashboardCharts({
  ventasChart = { series: [], maxTotal: 0 },
  stockDist = { total: 0, segments: [] },
  topValor = [],
  showStockChart = true,
}) {
  const series = ventasChart?.series ?? []
  const maxTotal = ventasChart?.maxTotal ?? 0
  const segments = stockDist?.segments ?? []
  const stockTotal = stockDist?.total ?? 0

  const chartCount = showStockChart ? 3 : 2

  return (
    <section
      className={`grid gap-4 ${chartCount === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}
      aria-label="Gráficas del negocio"
    >
      <BarChart
        title="Ventas (7 días)"
        subtitle="Total cobrado por día"
      >
        <div className="flex items-end justify-between gap-1 h-36 pt-2">
          {series.map((day) => {
            const height =
              maxTotal > 0
                ? Math.max(4, (day.total / maxTotal) * 100)
                : 4
            return (
              <div
                key={day.key}
                className="flex flex-1 flex-col items-center gap-1 min-w-0"
              >
                <span className="text-[10px] font-medium tabular-nums text-base-content/70">
                  {day.count > 0 ? formatChartCurrency(day.total) : "—"}
                </span>
                <div
                  className="w-full max-w-[40px] rounded-t-md bg-primary/85 transition-all hover:bg-primary"
                  style={{ height: `${height}%` }}
                  title={`${day.label}: ${formatPrecio(day.total)} (${day.count} ventas)`}
                />
                <span className="text-[10px] text-base-content/50 truncate w-full text-center">
                  {day.label}
                </span>
              </div>
            )
          })}
        </div>
        {series.every((d) => d.count === 0) && (
          <p className="text-center text-xs text-base-content/45 mt-2">
            Sin ventas en este periodo
          </p>
        )}
      </BarChart>

      {showStockChart ? (
        <BarChart title="Estado del stock" subtitle={`${stockTotal} productos`}>
          {stockTotal === 0 ? (
            <p className="text-sm text-base-content/50 py-8 text-center">
              Sin productos
            </p>
          ) : (
            <>
              <div className="flex h-3 overflow-hidden rounded-full bg-base-200">
                {segments.map((s) => (
                  <div
                    key={s.key}
                    className={`${s.color} transition-all`}
                    style={{
                      width: `${(s.count / stockTotal) * 100}%`,
                    }}
                    title={`${s.label}: ${s.count}`}
                  />
                ))}
              </div>
              <ul className="mt-4 space-y-2">
                {segments.map((s) => (
                  <li
                    key={s.key}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span className={`size-2.5 rounded-full ${s.color}`} />
                      {s.label}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {s.count}
                      <span className="text-base-content/45 font-normal text-xs ml-1">
                        ({Math.round((s.count / stockTotal) * 100)}%)
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </BarChart>
      ) : null}

      <BarChart title="Top valor en inventario" subtitle="Precio público × stock">
        {topValor.length === 0 ? (
          <p className="text-sm text-base-content/50 py-8 text-center">
            Sin inventario valorizado
          </p>
        ) : (
          <ul className="space-y-3">
            {topValor.map((item, i) => {
              const max = topValor[0]?.valor || 1
              const width = Math.max(8, (item.valor / max) * 100)
              return (
                <li key={item.id}>
                  <div className="flex justify-between gap-2 text-xs mb-1">
                    <span className="min-w-0 break-words whitespace-normal font-medium leading-snug">
                      {i + 1}. {item.nombre}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {formatPrecio(item.valor)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-base-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-base-content/45 mt-0.5">
                    Cód. {item.codigo} · {item.stock} u.
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </BarChart>
    </section>
  )
}
