import Link from "next/link"
import {
  Package,
  Wallet,
  AlertTriangle,
  ShoppingCart,
  Plus,
  TrendingUp,
} from "lucide-react"
import KpiCard from "./KpiCard"

export default function DashboardKpis({ metrics, showLowStock = true }) {
  if (!metrics) return null

  const {
    totalProductos,
    valorInventarioFmt,
    alertasCriticas,
    agotados,
    stockCriticoThreshold,
    ventasSemanaFmt,
    ventasSemanaCount,
  } = metrics

  return (
    <section aria-label="Métricas del inventario">
      <div
        className={`grid gap-4 sm:grid-cols-2 ${showLowStock ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}
      >
        <KpiCard
          title="Ventas (7 días)"
          value={ventasSemanaFmt ?? "$0.00"}
          subtitle={
            ventasSemanaCount > 0
              ? `${ventasSemanaCount} venta${ventasSemanaCount === 1 ? "" : "s"} registrada${ventasSemanaCount === 1 ? "" : "s"}`
              : "Sin ventas en la última semana"
          }
          icon={TrendingUp}
          accent="steel"
        />
        <KpiCard
          title="Productos registrados"
          value={totalProductos}
          subtitle="Ítems activos en catálogo"
          icon={Package}
          accent="steel"
        />
        <KpiCard
          title="Valor del inventario"
          value={valorInventarioFmt}
          subtitle="Precio público × stock"
          icon={Wallet}
          accent="amber"
        />
        {showLowStock ? (
          <KpiCard
            title="Alertas de stock"
            value={alertasCriticas}
            subtitle={
              agotados > 0
                ? `${agotados} agotado${agotados === 1 ? "" : "s"} · menos de ${stockCriticoThreshold} u.`
                : `Productos con menos de ${stockCriticoThreshold} unidades`
            }
            icon={AlertTriangle}
            accent={alertasCriticas > 0 ? "danger" : "success"}
          />
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/ventas" className="btn btn-primary btn-sm gap-2 shadow-sm">
          <ShoppingCart className="size-4" />
          Nueva venta
        </Link>
        <Link href="/productos" className="btn btn-outline btn-sm gap-2 border-base-300">
          <Plus className="size-4" />
          Agregar producto
        </Link>
      </div>
    </section>
  )
}
