import { formatPrecio } from "@/lib/productos"
import { formatFechaMexico } from "@/lib/fechas/mexico"
import { generarFacturaGlobal } from "@/app/(app)/facturacion/actions"

export default function FacturaGlobalPanel({ resumen }) {
  if (!resumen) return null

  const fechaLabel = formatFechaMexico(`${resumen.fecha}T12:00:00.000Z`)

  if (resumen.yaFacturadoGlobal && resumen.facturaGlobal) {
    const f = resumen.facturaGlobal
    return (
      <section className="rounded-box border border-success/30 bg-success/5 p-4">
        <h2 className="font-semibold">Factura global del día</h2>
        <p className="mt-1 text-sm text-base-content/70">
          {fechaLabel}: ya generaste factura global{" "}
          <strong>
            {f.serie}-{f.folio}
          </strong>{" "}
          por {formatPrecio(f.total)} ({f.estado}).
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-box border border-primary/25 bg-primary/5 p-4">
      <h2 className="font-semibold">Factura global del día</h2>
      <p className="mt-1 text-sm text-base-content/70">
        Agrupa todas las ventas de mostrador a <strong>Público en general</strong>{" "}
        ({resumen.pendientes} venta{resumen.pendientes === 1 ? "" : "s"},{" "}
        {formatPrecio(resumen.totalPendiente)}).
      </p>
      <p className="mt-1 text-xs text-base-content/55">
        Receptor RFC XAXX010101000 · Uso CFDI S01 · Periodicidad diaria (SAT).
      </p>

      {resumen.pendientes === 0 ? (
        <p className="mt-3 text-sm text-base-content/60">
          Hoy no hay ventas al público pendientes de facturar.
        </p>
      ) : (
        <form action={generarFacturaGlobal} className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="fecha" value={resumen.fecha} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="timbrar"
              value="1"
              className="checkbox checkbox-sm checkbox-primary"
            />
            Timbrar al generar (sandbox)
          </label>
          <button type="submit" className="btn btn-primary btn-sm touch-manipulation">
            Generar factura global — {fechaLabel}
          </button>
        </form>
      )}
    </section>
  )
}
