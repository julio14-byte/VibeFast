import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { ensureClientePublicoGeneral } from "@/lib/clientes/publicoGeneral"
import { getMembershipForUser } from "@/lib/organization/context"
import { formatPrecio, SAT_USOS_CFDI } from "@/lib/productos"
import EnviarCfdiButtons from "@/components/facturacion/EnviarCfdiButtons"
import { empresaConfigurada } from "@/lib/negocio/empresa"
import {
  generarFactura,
  timbrarFactura,
} from "./actions"

export const metadata = { title: "Facturación · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function FacturacionPage({ searchParams }) {
  const supabase = await createClient()
  const params = await searchParams

  const { data: { user } } = await supabase.auth.getUser()

  const [empresaRes, facturasRes, ventasRes, clientesRes] = await Promise.all([
    supabase.from("empresa_fiscal").select("*").maybeSingle(),
    supabase
      .from("facturas")
      .select(
        "id, serie, folio, total, estado, rfc_receptor, uuid_cfdi, created_at, cliente_id, email_enviado_at, whatsapp_enviado_at, cliente:clientes(email, telefono, razon_social, nombre)"
      )
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("ventas")
      .select("id, folio, total, created_at, cliente_id")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("clientes")
      .select("id, nombre, razon_social, rfc")
      .order("razon_social"),
  ])

  const empresa = empresaRes.data
  const facturas = facturasRes.data ?? []
  const ventas = ventasRes.data ?? []
  let clientes = clientesRes.data ?? []

  let clientePublicoGeneral = null
  if (user) {
    try {
      const membership = await getMembershipForUser(supabase, user.id)
      if (membership?.organizationId) {
        clientePublicoGeneral = await ensureClientePublicoGeneral(
          supabase,
          membership.organizationId,
          user.id,
          empresa?.codigo_postal
        )
      }
      if (
        clientePublicoGeneral &&
        !clientes.some((c) => c.id === clientePublicoGeneral.id)
      ) {
        clientes = [clientePublicoGeneral, ...clientes]
      }
    } catch {
      // migración 020 pendiente: sigue funcionando el fallback en generarFactura
    }
  }

  const preselectVentaId = params?.venta_id?.toString()
  const ventaPreselect = preselectVentaId
    ? ventas.find((v) => v.id === preselectVentaId)
    : null
  const defaultClienteId =
    ventaPreselect?.cliente_id ??
    clientePublicoGeneral?.id ??
    ""

  const formError = params?.error?.toString()
  const ok = params?.ok?.toString()
  const folioOk = params?.folio?.toString()
  const estadoOk = params?.estado?.toString()
  const waLink = params?.url?.toString()

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="page-title">Facturación electrónica</h1>
          <p className="page-lead">
            CFDI 4.0 SAT y clientes vinculados. PAC sandbox en{" "}
            <Link href="/settings" className="link link-primary">Configuración</Link>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/clientes" className="btn btn-outline btn-sm flex-1 sm:flex-none">
            Clientes
          </Link>
          <Link href="/negocio" className="btn btn-outline btn-sm flex-1 sm:flex-none">
            Mi negocio
          </Link>
          <Link href="/ventas" className="btn btn-outline btn-sm flex-1 sm:flex-none">
            Ventas
          </Link>
          <Link href="/cotizaciones" className="btn btn-outline btn-sm flex-1 sm:flex-none">
            Cotizaciones
          </Link>
        </div>
      </div>

      {formError && (
        <div role="alert" className="alert alert-error">
          <span>{formError}</span>
        </div>
      )}
      {ok === "fiscal" && (
        <div role="alert" className="alert alert-success">
          <span>Datos fiscales guardados.</span>
        </div>
      )}
      {ok === "factura" && (
        <div role="alert" className="alert alert-success">
          <span>
            Factura folio {folioOk} — estado: {estadoOk ?? "pendiente"}
          </span>
        </div>
      )}
      {ok === "timbrada" && (
        <div role="alert" className="alert alert-success">
          <span>Factura {folioOk} timbrada correctamente.</span>
        </div>
      )}
      {ok === "email" && (
        <div role="alert" className="alert alert-success">
          <span>CFDI folio {folioOk} enviado por correo electrónico.</span>
        </div>
      )}
      {ok === "whatsapp" && (
        <div role="alert" className="alert alert-success">
          <span>CFDI folio {folioOk} enviado por WhatsApp API.</span>
        </div>
      )}
      {ok === "whatsapp_link" && waLink && (
        <div role="alert" className="alert alert-info">
          <span className="flex flex-wrap items-center gap-2">
            Abre WhatsApp para enviar el mensaje al cliente.
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

      {!empresaConfigurada(empresa) && (
        <div role="alert" className="alert alert-warning">
          <span>
            Configura los datos fiscales en{" "}
            <Link href="/negocio" className="link font-semibold">
              Mi negocio
            </Link>{" "}
            antes de generar facturas.
          </span>
        </div>
      )}

      <section className="rounded-box border border-base-200 bg-base-100 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Datos del emisor</h2>
            <p className="text-sm text-base-content/60 mt-1">
              {empresa?.razon_social
                ? `${empresa.razon_social} · RFC ${empresa.rfc ?? "—"} · CP ${empresa.codigo_postal ?? "—"}`
                : "Aún no has registrado tu ferretería."}
            </p>
          </div>
          <Link href="/negocio" className="btn btn-primary btn-sm">
            {empresa?.rfc ? "Editar negocio" : "Configurar negocio"}
          </Link>
        </div>
      </section>

      <section className="rounded-box border border-base-200 bg-base-100 p-4">
        <h2 className="font-semibold mb-3">Generar factura de venta</h2>
        {ventas.length === 0 ? (
          <p className="text-sm text-base-content/60">
            Registra una venta en{" "}
            <Link href="/ventas" className="link link-primary">Ventas</Link>.
          </p>
        ) : (
          <form action={generarFactura} className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="label py-0">
                  <span className="label-text text-xs">Venta</span>
                </label>
                <select
                  name="venta_id"
                  required
                  defaultValue={preselectVentaId ?? undefined}
                  className="select select-bordered select-sm w-full"
                >
                  {ventas.map((v) => (
                    <option key={v.id} value={v.id}>
                      #{v.folio} — {formatPrecio(v.total)} —{" "}
                      {new Date(v.created_at).toLocaleDateString("es-MX")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label py-0">
                  <span className="label-text text-xs">Cliente</span>
                </label>
                <select
                  name="cliente_id"
                  defaultValue={defaultClienteId}
                  className="select select-bordered select-sm w-full"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.es_publico_general
                        ? "Público en general"
                        : c.razon_social ?? c.nombre}{" "}
                      — {c.rfc}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label py-0">
                  <span className="label-text text-xs">Uso CFDI (opcional)</span>
                </label>
                <select
                  name="uso_cfdi"
                  defaultValue={clientePublicoGeneral?.uso_cfdi ?? "S01"}
                  className="select select-bordered select-sm w-full"
                >
                  {SAT_USOS_CFDI.map((u) => (
                    <option key={u.clave} value={u.clave}>
                      {u.clave} — {u.nombre}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-base-content/55">
                  Para ventas diarias al mostrador usa{" "}
                  <strong>S01 — Sin efectos fiscales</strong> con Público en general.
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="timbrar"
                value="1"
                className="checkbox checkbox-sm checkbox-primary"
              />
              Timbrar con PAC al generar (sandbox o producción)
            </label>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary btn-sm">
                Generar CFDI
              </button>
              <Link href="/clientes" className="btn btn-ghost btn-sm">
                Gestionar clientes
              </Link>
            </div>
          </form>
        )}
      </section>

      {facturas.length > 0 && (
        <section className="rounded-box border border-base-200 bg-base-100 p-4">
          <h2 className="font-semibold mb-3">Facturas emitidas</h2>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Serie/Folio</th>
                  <th>Receptor</th>
                  <th>UUID</th>
                  <th className="text-right">Total</th>
                  <th>Estado</th>
                  <th>Enviar CFDI</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {facturas.map((f) => (
                  <tr key={f.id}>
                    <td className="font-mono">{f.serie}-{f.folio}</td>
                    <td className="font-mono text-sm">{f.rfc_receptor}</td>
                    <td className="text-xs font-mono max-w-[120px] truncate">
                      {f.uuid_cfdi ?? "—"}
                    </td>
                    <td className="text-right">{formatPrecio(f.total)}</td>
                    <td>
                      <span
                        className={`badge badge-sm ${
                          f.estado === "timbrada"
                            ? "badge-success"
                            : f.estado === "cancelada"
                              ? "badge-error"
                              : "badge-warning"
                        }`}
                      >
                        {f.estado}
                      </span>
                    </td>
                    <td>
                      <EnviarCfdiButtons
                        facturaId={f.id}
                        defaultEmail={f.cliente?.email ?? ""}
                        defaultTelefono={f.cliente?.telefono ?? ""}
                      />
                      {(f.email_enviado_at || f.whatsapp_enviado_at) && (
                        <p className="mt-1 text-[10px] text-base-content/50">
                          {f.email_enviado_at && "✉ Email"}
                          {f.email_enviado_at && f.whatsapp_enviado_at && " · "}
                          {f.whatsapp_enviado_at && "WA"}
                        </p>
                      )}
                    </td>
                    <td>
                      {f.estado === "pendiente" && (
                        <form action={timbrarFactura}>
                          <input type="hidden" name="factura_id" value={f.id} />
                          <button
                            type="submit"
                            className="btn btn-outline btn-xs"
                          >
                            Timbrar
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
