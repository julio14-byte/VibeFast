import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { formatPrecio } from "@/lib/productos"
import PageHeader from "@/components/ui/PageHeader"
import {
  cotizacionEstadoBadge,
  cotizacionEstadoLabel,
} from "@/lib/cotizaciones/labels"

export const metadata = { title: "Cotizaciones · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function CotizacionesPage({ searchParams }) {
  const supabase = await createClient()
  const params = await searchParams

  const { data: cotizaciones } = await supabase
    .from("cotizaciones")
    .select(
      "id, folio, total, estado, created_at, vence_at, cliente:clientes(nombre, razon_social), venta_id"
    )
    .order("created_at", { ascending: false })
    .limit(50)

  const list = cotizaciones ?? []
  const formError = params?.error?.toString()
  const ok = params?.ok?.toString()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cotizaciones"
        lead="Arma presupuestos, envíalos por WhatsApp y conviértelos en venta cuando el cliente apruebe."
        tip="Al aprobar se descuenta inventario. También puedes generar factura desde la cotización."
        actions={
          <Link
            href="/cotizaciones/nueva"
            className="btn btn-primary btn-sm shrink-0 touch-manipulation min-h-11"
          >
            Nueva cotización
          </Link>
        }
      />

      {formError && (
        <div role="alert" className="alert alert-error">
          <span>{formError}</span>
        </div>
      )}
      {ok && (
        <div role="alert" className="alert alert-success">
          <span>Operación completada.</span>
        </div>
      )}

      {list.length === 0 ? (
        <div className="rounded-box border border-base-200 bg-base-100 p-8 text-center">
          <p className="text-base-content/70 mb-4">
            Aún no tienes cotizaciones. Crea la primera para enviar presupuestos
            por WhatsApp.
          </p>
          <Link href="/cotizaciones/nueva" className="btn btn-primary">
            Crear cotización
          </Link>
        </div>
      ) : (
        <div className="rounded-box border border-base-200 bg-base-100 p-4">
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Vence</th>
                  <th className="text-right">Total</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const vencida =
                    c.estado !== "convertida" &&
                    c.estado !== "rechazada" &&
                    new Date(c.vence_at) < new Date()
                  const estado = vencida ? "vencida" : c.estado

                  return (
                    <tr key={c.id}>
                      <td className="font-mono">#{c.folio}</td>
                      <td className="text-sm max-w-[140px] truncate">
                        {c.cliente?.razon_social ??
                          c.cliente?.nombre ??
                          "—"}
                      </td>
                      <td className="text-sm whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString("es-MX")}
                      </td>
                      <td className="text-sm whitespace-nowrap">
                        {new Date(c.vence_at).toLocaleDateString("es-MX")}
                      </td>
                      <td className="text-right font-medium tabular-nums">
                        {formatPrecio(c.total)}
                      </td>
                      <td>
                        <span
                          className={`badge badge-sm ${cotizacionEstadoBadge(estado)}`}
                        >
                          {cotizacionEstadoLabel(estado)}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/cotizaciones/${c.id}`}
                          className="btn btn-ghost btn-xs touch-manipulation"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
