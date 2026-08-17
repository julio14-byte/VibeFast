import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { formatPrecio, SAT_FORMAS_PAGO } from "@/lib/productos"
import PageHeader from "@/components/ui/PageHeader"
import {
  cotizacionEstadoBadge,
  cotizacionEstadoLabel,
  cotizacionPuedeConvertir,
} from "@/lib/cotizaciones/labels"
import {
  enviarCotizacionWhatsApp,
  enviarCotizacionEmail,
  rechazarCotizacion,
  convertirCotizacionAVenta,
  convertirCotizacionYFacturar,
} from "../actions"

export const metadata = { title: "Detalle cotización · SmartPOS" }
export const dynamic = "force-dynamic"

function formaPagoLabel(clave) {
  return SAT_FORMAS_PAGO.find((f) => f.clave === clave)?.nombre ?? clave
}

export default async function CotizacionDetallePage({ params, searchParams }) {
  const supabase = await createClient()
  const { id } = await params
  const query = await searchParams

  const { data: cotizacion } = await supabase
    .from("cotizaciones")
    .select(
      "*, items:cotizacion_items(*), cliente:clientes(id, nombre, razon_social, telefono, email, rfc), venta:ventas(id, folio, total)"
    )
    .eq("id", id)
    .single()

  if (!cotizacion) notFound()

  const vencida =
    cotizacion.estado !== "convertida" &&
    cotizacion.estado !== "rechazada" &&
    new Date(cotizacion.vence_at) < new Date()
  const estadoDisplay = vencida ? "vencida" : cotizacion.estado
  const puedeConvertir =
    cotizacionPuedeConvertir(cotizacion.estado) && !vencida

  const formError = query?.error?.toString()
  const ok = query?.ok?.toString()
  const waLink = query?.url?.toString()
  const ventaFolio = query?.venta_folio?.toString()
  const ventaTotal = query?.venta_total?.toString()
  const ventaId = query?.venta_id?.toString()
  const facturaFolio = query?.factura_folio?.toString()
  const facturaEstado = query?.factura_estado?.toString()
  const facturaId = query?.factura_id?.toString()

  const clienteNombre =
    cotizacion.cliente?.razon_social ?? cotizacion.cliente?.nombre

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Cotización #${cotizacion.folio}`}
        lead={
          clienteNombre
            ? `Cliente: ${clienteNombre}`
            : "Sin cliente asignado"
        }
        actions={
          <Link
            href="/cotizaciones"
            className="btn btn-outline btn-sm shrink-0 touch-manipulation min-h-11"
          >
            Volver
          </Link>
        }
      />

      {formError && (
        <div role="alert" className="alert alert-error">
          <span>{formError}</span>
        </div>
      )}
      {ok === "creada" && (
        <div role="alert" className="alert alert-success">
          <span>Cotización guardada. Puedes enviarla por WhatsApp o aprobarla.</span>
        </div>
      )}
      {ok === "whatsapp" && (
        <div role="alert" className="alert alert-success">
          <span>Presupuesto enviado por WhatsApp.</span>
        </div>
      )}
      {ok === "email" && (
        <div role="alert" className="alert alert-success">
          <span>Cotización enviada por correo electrónico.</span>
        </div>
      )}
      {ok === "whatsapp_link" && waLink && (
        <div role="alert" className="alert alert-info">
          <span className="flex flex-wrap items-center gap-2">
            Abre WhatsApp para enviar el presupuesto.
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-success"
            >
              Abrir WhatsApp
            </a>
          </span>
        </div>
      )}
      {ok === "venta" && (
        <div role="alert" className="alert alert-success">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Venta #{ventaFolio} registrada por {formatPrecio(ventaTotal)}.
            </span>
            {ventaId && (
              <>
                <Link
                  href={`/ventas/ticket/${ventaId}?print=1`}
                  className="btn btn-sm btn-outline touch-manipulation min-h-10"
                >
                  Imprimir ticket
                </Link>
                <Link
                  href={`/facturacion?venta_id=${ventaId}`}
                  className="btn btn-sm btn-primary touch-manipulation min-h-10"
                >
                  Facturar venta
                </Link>
              </>
            )}
          </div>
        </div>
      )}
      {ok === "factura" && (
        <div role="alert" className="alert alert-success">
          <span>
            Factura folio {facturaFolio} — estado: {facturaEstado ?? "pendiente"}.
            {facturaId && (
              <>
                {" "}
                <Link href="/facturacion" className="link link-primary">
                  Ver en facturación
                </Link>
              </>
            )}
          </span>
        </div>
      )}
      {ok === "rechazada" && (
        <div role="alert" className="alert alert-warning">
          <span>Cotización marcada como rechazada.</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="order-2 space-y-4 lg:order-1 lg:col-span-2">
          <div className="rounded-box border border-base-200 bg-base-100 p-4">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span
                className={`badge ${cotizacionEstadoBadge(estadoDisplay)}`}
              >
                {cotizacionEstadoLabel(estadoDisplay)}
              </span>
              <span className="text-sm text-base-content/60 capitalize">
                Precio {cotizacion.tipo_precio}
              </span>
              <span className="text-sm text-base-content/60">
                Vence{" "}
                {new Date(cotizacion.vence_at).toLocaleDateString("es-MX")}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="text-right">Cant.</th>
                    <th className="text-right">P. unit.</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(cotizacion.items ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="font-medium">{item.nombre}</span>
                        <span className="block text-xs text-base-content/55 font-mono">
                          cód. {item.codigo}
                        </span>
                      </td>
                      <td className="text-right tabular-nums">{item.cantidad}</td>
                      <td className="text-right tabular-nums">
                        {formatPrecio(item.precio_unitario)}
                      </td>
                      <td className="text-right tabular-nums font-medium">
                        {formatPrecio(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="text-right text-base-content/70">
                      Subtotal (sin IVA)
                    </td>
                    <td className="text-right tabular-nums">
                      {formatPrecio(cotizacion.subtotal)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="text-right text-base-content/70">
                      IVA (16%)
                    </td>
                    <td className="text-right tabular-nums">
                      {formatPrecio(cotizacion.iva)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="text-right font-bold">
                      Total
                    </td>
                    <td className="text-right font-bold tabular-nums">
                      {formatPrecio(cotizacion.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {cotizacion.notas && (
              <p className="mt-4 text-sm text-base-content/70 border-t border-base-200 pt-3">
                <strong>Notas:</strong> {cotizacion.notas}
              </p>
            )}
          </div>

          {cotizacion.venta && (
            <div className="rounded-box border border-success/30 bg-success/5 p-4">
              <h3 className="font-semibold text-success mb-1">Venta vinculada</h3>
              <p className="text-sm">
                Venta #{cotizacion.venta.folio} —{" "}
                {formatPrecio(cotizacion.venta.total)}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Link
                  href={`/ventas/ticket/${cotizacion.venta.id}`}
                  className="btn btn-sm btn-outline"
                >
                  Ver ticket
                </Link>
                <Link
                  href={`/facturacion?venta_id=${cotizacion.venta.id}`}
                  className="btn btn-sm btn-primary"
                >
                  Facturar
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="order-1 space-y-4 lg:order-2">
          <div className="rounded-box border border-base-200 bg-base-100 p-4 space-y-2 text-sm">
            <p>
              <span className="text-base-content/60">Forma de pago:</span>{" "}
              {formaPagoLabel(cotizacion.forma_pago)}
            </p>
            <p>
              <span className="text-base-content/60">Validez:</span>{" "}
              {cotizacion.validez_dias} días
            </p>
            {cotizacion.telefono_whatsapp && (
              <p>
                <span className="text-base-content/60">WhatsApp:</span>{" "}
                {cotizacion.telefono_whatsapp}
              </p>
            )}
            {cotizacion.whatsapp_enviado_at && (
              <p className="text-xs text-base-content/55">
                WhatsApp{" "}
                {new Date(cotizacion.whatsapp_enviado_at).toLocaleString("es-MX")}
              </p>
            )}
            {cotizacion.email_enviado_at && (
              <p className="text-xs text-base-content/55">
                Correo a {cotizacion.email_destino ?? "cliente"}{" "}
                {new Date(cotizacion.email_enviado_at).toLocaleString("es-MX")}
              </p>
            )}
          </div>

          {puedeConvertir && (
            <div className="rounded-box border border-base-200 bg-base-100 p-4 space-y-4">
              <h3 className="font-semibold">Acciones</h3>

              <form action={enviarCotizacionWhatsApp} className="space-y-2">
                <input type="hidden" name="cotizacion_id" value={cotizacion.id} />
                <label className="form-control w-full">
                  <span className="label-text text-xs font-medium">
                    Enviar por WhatsApp
                  </span>
                  <input
                    name="telefono_whatsapp"
                    type="tel"
                    defaultValue={
                      cotizacion.telefono_whatsapp ??
                      cotizacion.cliente?.telefono ??
                      ""
                    }
                    placeholder="52 1 55 1234 5678"
                    className="input input-bordered input-sm w-full"
                  />
                </label>
                <button type="submit" className="btn btn-success btn-sm w-full">
                  Enviar presupuesto
                </button>
              </form>

              <form action={enviarCotizacionEmail} className="space-y-2">
                <input type="hidden" name="cotizacion_id" value={cotizacion.id} />
                <label className="form-control w-full">
                  <span className="label-text text-xs font-medium">
                    Enviar por correo
                  </span>
                  <input
                    name="email"
                    type="email"
                    defaultValue={cotizacion.cliente?.email ?? ""}
                    placeholder="cliente@correo.com"
                    className="input input-bordered input-sm w-full"
                  />
                </label>
                <button type="submit" className="btn btn-outline btn-sm w-full">
                  Enviar por email
                </button>
              </form>

              <div className="divider my-1 text-xs">Si el cliente aprueba</div>

              <form action={convertirCotizacionAVenta} className="space-y-2">
                <input type="hidden" name="cotizacion_id" value={cotizacion.id} />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="imprimir_ticket"
                    value="1"
                    className="checkbox checkbox-sm checkbox-primary"
                  />
                  Imprimir ticket al aprobar
                </label>
                <button type="submit" className="btn btn-primary btn-sm w-full">
                  Aprobar → registrar venta
                </button>
                <p className="text-xs text-base-content/55">
                  Descuenta existencias y crea la venta en el sistema.
                </p>
              </form>

              <form action={convertirCotizacionYFacturar} className="space-y-2">
                <input type="hidden" name="cotizacion_id" value={cotizacion.id} />
                {cotizacion.cliente_id && (
                  <input
                    type="hidden"
                    name="cliente_id"
                    value={cotizacion.cliente_id}
                  />
                )}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="timbrar"
                    value="1"
                    className="checkbox checkbox-sm checkbox-primary"
                  />
                  Timbrar con PAC al facturar
                </label>
                <button type="submit" className="btn btn-outline btn-sm w-full">
                  Aprobar y generar factura
                </button>
              </form>

              <form action={rechazarCotizacion}>
                <input type="hidden" name="cotizacion_id" value={cotizacion.id} />
                <button
                  type="submit"
                  className="btn btn-ghost btn-sm w-full text-error"
                >
                  Marcar como rechazada
                </button>
              </form>
            </div>
          )}

          {vencida && cotizacion.estado !== "convertida" && (
            <div role="alert" className="alert alert-warning text-sm">
              <span>Esta cotización ya venció. Crea una nueva si el cliente sigue interesado.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
