import DashboardKpis from "@/components/dashboard/DashboardKpis"
import InventoryTable from "@/components/dashboard/InventoryTable"
import StockAlertsPanel from "@/components/dashboard/StockAlertsPanel"
import DashboardCharts from "@/components/dashboard/DashboardCharts"
import QuickActionsBar from "@/components/dashboard/QuickActionsBar"

export default function DashboardView({
  metrics,
  productos,
  totalProductos,
  appName,
  chartData,
}) {
  return (
    <div className="dashboard-pos space-y-6">
      <header className="dashboard-hero relative overflow-hidden rounded-2xl border border-base-300/60 bg-gradient-to-br from-neutral via-base-200 to-base-100 px-5 py-6 sm:px-8 sm:py-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-45deg, currentColor 0, currentColor 1px, transparent 0, transparent 12px)",
          }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Panel de control
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
              {appName}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-base-content/65 sm:text-base">
              Inventario, ventas y alertas en un solo lugar — optimizado para
              mostrador de ferretería.
            </p>
          </div>
          <div className="hidden sm:block">
            <QuickActionsBar />
          </div>
        </div>
      </header>

      <div className="sm:hidden">
        <QuickActionsBar />
      </div>

      <DashboardKpis metrics={metrics} />

      <DashboardCharts
        ventasChart={chartData.ventasChart}
        stockDist={chartData.stockDist}
        topValor={chartData.topValor}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <div className="space-y-2">
          {totalProductos > productos.length && (
            <p className="text-xs text-base-content/55 px-1">
              Mostrando {productos.length} de {totalProductos} productos.{" "}
              <a href="/inventario" className="link link-primary">
                Ver inventario completo
              </a>
            </p>
          )}
          <InventoryTable productos={productos} />
        </div>
        <StockAlertsPanel
          alertasList={metrics.alertasList}
          totalCriticas={metrics.alertasCriticas}
        />
      </div>
    </div>
  )
}
