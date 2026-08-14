import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { formatPrecio } from "@/lib/productos"
import VentasPOS from "@/components/ventas/VentasPOS"

export const metadata = { title: "Ventas · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function VentasPage({ searchParams }) {
  const supabase = await createClient()
  const params = await searchParams

  const [clientesRes, ventasRes] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nombre, razon_social, usa_precio_mayoreo")
      .order("nombre"),
    supabase
      .from("ventas")
      .select("id, folio, total, created_at, tipo_precio")
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  const clientes = clientesRes.data ?? []
  const ventas = ventasRes.data ?? []
  const formError = params?.error?.toString()
  const ok = params?.ok?.toString()
  const folioOk = params?.folio?.toString()
  const totalOk = params?.total?.toString()
  const ventaId = params?.venta_id?.toString()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Ventas</h1>
          <p className="page-lead">
            Punto de venta con búsqueda en servidor (miles de productos).
          </p>
        </div>
        <Link
          href="/facturacion"
          className="btn btn-outline btn-sm shrink-0 touch-manipulation"
        >
          Facturación
        </Link>
      </div>

      {formError && (
        <div role="alert" className="alert alert-error">
          <span>{formError}</span>
        </div>
      )}
      {ok === "venta" && (
        <div role="alert" className="alert alert-success">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Venta #{folioOk} registrada por {formatPrecio(totalOk)}.
            </span>
            {ventaId && (
              <Link
                href={`/ventas/ticket/${ventaId}?print=1`}
                className="btn btn-sm btn-outline touch-manipulation"
              >
                Imprimir ticket
              </Link>
            )}
          </div>
        </div>
      )}

      <VentasPOS clientes={clientes} />

      {ventas.length > 0 && (
        <div className="rounded-box border border-base-200 bg-base-100 p-4">
          <h2 className="font-semibold mb-3">Últimas ventas</h2>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th className="text-right">Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => (
                  <tr key={v.id}>
                    <td className="font-mono">#{v.folio}</td>
                    <td className="text-sm">
                      {new Date(v.created_at).toLocaleString("es-MX")}
                    </td>
                    <td className="text-sm capitalize">{v.tipo_precio}</td>
                    <td className="text-right font-medium">
                      {formatPrecio(v.total)}
                    </td>
                    <td>
                      <Link
                        href={`/ventas/ticket/${v.id}`}
                        className="btn btn-ghost btn-xs touch-manipulation"
                      >
                        Ticket
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
