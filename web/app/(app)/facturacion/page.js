import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import {
  formatPrecio,
  SAT_REGIMENES,
  SAT_USOS_CFDI,
} from "@/lib/productos"
import {
  guardarEmpresaFiscal,
  generarFactura,
  crearCliente,
} from "../ventas/actions"

export const metadata = { title: "Facturación · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function FacturacionPage({ searchParams }) {
  const supabase = await createClient()
  const params = await searchParams

  const [empresaRes, facturasRes, ventasRes, clientesRes] = await Promise.all([
    supabase.from("empresa_fiscal").select("*").maybeSingle(),
    supabase
      .from("facturas")
      .select("id, serie, folio, total, estado, rfc_receptor, created_at")
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("ventas")
      .select("id, folio, total, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("clientes").select("*").order("nombre"),
  ])

  const empresa = empresaRes.data
  const facturas = facturasRes.data ?? []
  const ventas = ventasRes.data ?? []
  const clientes = clientesRes.data ?? []

  const formError = params?.error?.toString()
  const ok = params?.ok?.toString()
  const folioOk = params?.folio?.toString()

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Facturación electrónica
          </h1>
          <p className="mt-1 text-sm text-base-content/70">
            CFDI 4.0 conforme al SAT. Configura tu emisor, genera facturas de
            ventas y descarga el XML.
          </p>
        </div>
        <Link href="/ventas" className="btn btn-outline btn-sm">
          Ventas
        </Link>
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
          <span>Factura {folioOk ? `folio ${folioOk}` : ""} generada (pendiente de timbrado PAC).</span>
        </div>
      )}
      {ok === "cliente" && (
        <div role="alert" className="alert alert-success">
          <span>Cliente registrado.</span>
        </div>
      )}

      <div className="alert alert-info text-sm">
        <span>
          El XML generado cumple la estructura CFDI 4.0 del SAT. Para timbrar
          oficialmente necesitas un PAC certificado (Finkok, SW, etc.) y tu CSD.
        </span>
      </div>

      {/* Datos del emisor */}
      <section className="rounded-box border border-base-200 bg-base-100 p-4">
        <h2 className="font-semibold mb-3">Datos fiscales del emisor</h2>
        <form action={guardarEmpresaFiscal} className="grid gap-2 sm:grid-cols-2">
          <input
            name="rfc"
            required
            placeholder="RFC"
            defaultValue={empresa?.rfc ?? ""}
            className="input input-bordered input-sm"
            aria-label="RFC emisor"
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
            aria-label="Régimen fiscal"
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
            aria-label="Código postal"
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
            aria-label="Serie factura"
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Guardar datos fiscales
          </button>
        </form>
      </section>

      {/* Clientes */}
      <section className="rounded-box border border-base-200 bg-base-100 p-4">
        <h2 className="font-semibold mb-3">Clientes</h2>
        <form action={crearCliente} className="grid gap-2 sm:grid-cols-3 mb-4">
          <input name="nombre" required placeholder="Nombre" className="input input-bordered input-sm" />
          <input name="rfc" placeholder="RFC" className="input input-bordered input-sm" />
          <input name="codigo_postal" placeholder="CP" className="input input-bordered input-sm" />
          <select name="regimen_fiscal" className="select select-bordered select-sm" defaultValue="616">
            {SAT_REGIMENES.map((r) => (
              <option key={r.clave} value={r.clave}>{r.clave} — {r.nombre}</option>
            ))}
          </select>
          <select name="uso_cfdi" className="select select-bordered select-sm" defaultValue="G03">
            {SAT_USOS_CFDI.map((u) => (
              <option key={u.clave} value={u.clave}>{u.clave} — {u.nombre}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-outline btn-sm">Agregar cliente</button>
        </form>
        {clientes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>RFC</th>
                  <th>Uso CFDI</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nombre}</td>
                    <td className="font-mono text-sm">{c.rfc}</td>
                    <td className="text-sm">{c.uso_cfdi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Generar factura */}
      <section className="rounded-box border border-base-200 bg-base-100 p-4">
        <h2 className="font-semibold mb-3">Generar factura de venta</h2>
        {ventas.length === 0 ? (
          <p className="text-sm text-base-content/60">
            Registra una venta primero en{" "}
            <Link href="/ventas" className="link link-primary">Ventas</Link>.
          </p>
        ) : (
          <form action={generarFactura} className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="label py-0">
                <span className="label-text text-xs">Venta</span>
              </label>
              <select name="venta_id" required className="select select-bordered select-sm w-full">
                {ventas.map((v) => (
                  <option key={v.id} value={v.id}>
                    #{v.folio} — {formatPrecio(v.total)} — {new Date(v.created_at).toLocaleDateString("es-MX")}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="label py-0">
                <span className="label-text text-xs">Cliente (opcional)</span>
              </label>
              <select name="cliente_id" className="select select-bordered select-sm w-full">
                <option value="">Público en general</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-sm">
              Generar CFDI
            </button>
          </form>
        )}
      </section>

      {/* Facturas emitidas */}
      {facturas.length > 0 && (
        <section className="rounded-box border border-base-200 bg-base-100 p-4">
          <h2 className="font-semibold mb-3">Facturas emitidas</h2>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Serie/Folio</th>
                  <th>Receptor</th>
                  <th className="text-right">Total</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {facturas.map((f) => (
                  <tr key={f.id}>
                    <td className="font-mono">{f.serie}-{f.folio}</td>
                    <td className="font-mono text-sm">{f.rfc_receptor}</td>
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
                    <td className="text-sm">
                      {new Date(f.created_at).toLocaleDateString("es-MX")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="text-sm text-base-content/60 space-y-1">
        <p className="font-medium text-base-content">Requerimientos SAT incluidos:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>CFDI 4.0 con emisor, receptor, conceptos e impuestos IVA 16%</li>
          <li>Catálogos: forma de pago, método PUE, uso CFDI, régimen fiscal</li>
          <li>Clave producto/servicio y unidad en cada producto</li>
          <li>Folio y serie de facturación</li>
          <li>Estados: pendiente (pre-timbrado), timbrada, cancelada</li>
        </ul>
      </section>
    </div>
  )
}
