import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { formatPrecio, SAT_REGIMENES } from "@/lib/productos"
import { PAC_PROVIDERS } from "@/lib/pac/sandbox"
import {
  guardarEmpresaFiscal,
  guardarPacConfig,
  generarFactura,
  timbrarFactura,
} from "./actions"

export const metadata = { title: "Facturación · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function FacturacionPage({ searchParams }) {
  const supabase = await createClient()
  const params = await searchParams

  const [empresaRes, facturasRes, ventasRes, clientesRes] = await Promise.all([
    supabase.from("empresa_fiscal").select("*").maybeSingle(),
    supabase
      .from("facturas")
      .select("id, serie, folio, total, estado, rfc_receptor, uuid_cfdi, created_at")
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
  const clientes = clientesRes.data ?? []

  const formError = params?.error?.toString()
  const ok = params?.ok?.toString()
  const folioOk = params?.folio?.toString()
  const estadoOk = params?.estado?.toString()

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Facturación electrónica
          </h1>
          <p className="mt-1 text-sm text-base-content/70">
            CFDI 4.0 SAT, conexión PAC sandbox y clientes vinculados.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/clientes" className="btn btn-outline btn-sm">
            Clientes
          </Link>
          <Link href="/ventas" className="btn btn-outline btn-sm">
            Ventas
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
      {ok === "pac" && (
        <div role="alert" className="alert alert-success">
          <span>Configuración PAC guardada.</span>
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

      <section className="rounded-box border border-base-200 bg-base-100 p-4">
        <h2 className="font-semibold mb-3">Datos fiscales del emisor</h2>
        <form action={guardarEmpresaFiscal} className="grid gap-2 sm:grid-cols-2">
          <input
            name="rfc"
            required
            placeholder="RFC"
            defaultValue={empresa?.rfc ?? ""}
            className="input input-bordered input-sm"
            aria-label="RFC"
          />
          <input
            name="razon_social"
            required
            placeholder="Razón social"
            defaultValue={empresa?.razon_social ?? ""}
            className="input input-bordered input-sm"
            aria-label="Razón social"
          />
          <select
            name="regimen_fiscal"
            defaultValue={empresa?.regimen_fiscal ?? "612"}
            className="select select-bordered select-sm"
            aria-label="Régimen"
          >
            {SAT_REGIMENES.map((r) => (
              <option key={r.clave} value={r.clave}>{r.nombre}</option>
            ))}
          </select>
          <input
            name="codigo_postal"
            required
            placeholder="Código postal"
            defaultValue={empresa?.codigo_postal ?? ""}
            className="input input-bordered input-sm"
            aria-label="CP"
          />
          <input
            name="direccion"
            placeholder="Dirección"
            defaultValue={empresa?.direccion ?? ""}
            className="input input-bordered input-sm sm:col-span-2"
            aria-label="Dirección"
          />
          <input
            name="serie_factura"
            placeholder="Serie"
            defaultValue={empresa?.serie_factura ?? "A"}
            className="input input-bordered input-sm w-24"
            aria-label="Serie"
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Guardar emisor
          </button>
        </form>
      </section>

      <section className="rounded-box border border-base-200 bg-base-100 p-4">
        <h2 className="font-semibold mb-1">Conexión PAC (sandbox)</h2>
        <p className="text-xs text-base-content/60 mb-3">
          Configura el proveedor PAC para timbrar. En sandbox se simula el
          timbrado; con credenciales Facturama se prueba el sandbox real.
        </p>
        <form action={guardarPacConfig} className="grid gap-2 sm:grid-cols-2">
          <select
            name="pac_provider"
            defaultValue={empresa?.pac_provider ?? "sandbox"}
            className="select select-bordered select-sm"
            aria-label="Proveedor PAC"
          >
            {PAC_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          <select
            name="pac_mode"
            defaultValue={empresa?.pac_mode ?? "sandbox"}
            className="select select-bordered select-sm"
            aria-label="Modo PAC"
          >
            <option value="sandbox">Sandbox (pruebas)</option>
            <option value="production">Producción</option>
          </select>
          <input
            name="pac_sandbox_url"
            placeholder="URL sandbox PAC"
            defaultValue={
              empresa?.pac_sandbox_url ?? "https://sandbox.facturama.mx"
            }
            className="input input-bordered input-sm sm:col-span-2"
            aria-label="URL sandbox"
          />
          <input
            name="pac_api_key"
            placeholder="API Key (usuario)"
            defaultValue={empresa?.pac_api_key ?? ""}
            className="input input-bordered input-sm"
            aria-label="API Key"
          />
          <input
            name="pac_api_secret"
            type="password"
            placeholder="API Secret"
            defaultValue={empresa?.pac_api_secret ?? ""}
            className="input input-bordered input-sm"
            aria-label="API Secret"
          />
          <button type="submit" className="btn btn-outline btn-sm">
            Guardar PAC
          </button>
        </form>
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
                  className="select select-bordered select-sm w-full"
                >
                  <option value="">Público en general</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razon_social ?? c.nombre} — {c.rfc}
                    </option>
                  ))}
                </select>
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
