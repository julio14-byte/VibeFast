import { SAT_REGIMENES } from "@/lib/sat/catalogos"
import { TICKET_DEFAULTS } from "@/lib/negocio/empresa"
import { guardarNegocio } from "@/app/(app)/negocio/actions"

function TicketCheckbox({ name, label, defaultChecked = true }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        value="1"
        defaultChecked={defaultChecked}
        className="checkbox checkbox-sm checkbox-primary"
      />
      {label}
    </label>
  )
}

export default function NegocioForm({ empresa, organizationName }) {
  const e = empresa ?? {}

  return (
    <form action={guardarNegocio} className="space-y-6">
      <section className="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
        <h2 className="text-lg font-bold">Datos generales</h2>
        <p className="mt-1 text-sm text-base-content/60">
          Nombre en mostrador, contacto y dirección. También aparecen en el ticket.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="form-control sm:col-span-2">
            <span className="label-text text-xs font-medium">
              Nombre comercial (ticket y menú)
            </span>
            <input
              name="nombre_comercial"
              placeholder={organizationName || "Ej. Ferretería El Tornillo"}
              defaultValue={e.nombre_comercial ?? ""}
              className="input input-bordered input-sm w-full"
            />
          </label>
          <label className="form-control">
            <span className="label-text text-xs font-medium">Teléfono</span>
            <input
              name="telefono"
              type="tel"
              placeholder="442 123 4567"
              defaultValue={e.telefono ?? ""}
              className="input input-bordered input-sm w-full"
            />
          </label>
          <label className="form-control">
            <span className="label-text text-xs font-medium">Correo</span>
            <input
              name="email"
              type="email"
              placeholder="ventas@tutienda.com"
              defaultValue={e.email ?? ""}
              className="input input-bordered input-sm w-full"
            />
          </label>
          <label className="form-control sm:col-span-2">
            <span className="label-text text-xs font-medium">Dirección</span>
            <input
              name="direccion"
              placeholder="Calle, número, colonia, ciudad"
              defaultValue={e.direccion ?? ""}
              className="input input-bordered input-sm w-full"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
        <h2 className="text-lg font-bold">Datos fiscales (SAT / CFDI)</h2>
        <p className="mt-1 text-sm text-base-content/60">
          Obligatorios para timbrar facturas. El emisor del CFDI usa estos datos.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="form-control">
            <span className="label-text text-xs font-medium">RFC *</span>
            <input
              name="rfc"
              required
              placeholder="XAXX010101000"
              defaultValue={e.rfc ?? ""}
              className="input input-bordered input-sm w-full uppercase"
            />
          </label>
          <label className="form-control">
            <span className="label-text text-xs font-medium">Razón social *</span>
            <input
              name="razon_social"
              required
              placeholder="RAZÓN SOCIAL SA DE CV"
              defaultValue={e.razon_social ?? ""}
              className="input input-bordered input-sm w-full"
            />
          </label>
          <label className="form-control">
            <span className="label-text text-xs font-medium">Régimen fiscal</span>
            <select
              name="regimen_fiscal"
              defaultValue={e.regimen_fiscal ?? "612"}
              className="select select-bordered select-sm w-full"
            >
              {SAT_REGIMENES.map((r) => (
                <option key={r.clave} value={r.clave}>
                  {r.clave} — {r.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control">
            <span className="label-text text-xs font-medium">Código postal *</span>
            <input
              name="codigo_postal"
              required
              placeholder="76000"
              defaultValue={e.codigo_postal ?? ""}
              className="input input-bordered input-sm w-full"
            />
          </label>
          <label className="form-control">
            <span className="label-text text-xs font-medium">Serie de facturas</span>
            <input
              name="serie_factura"
              placeholder="A"
              defaultValue={e.serie_factura ?? "A"}
              className="input input-bordered input-sm w-full"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
        <h2 className="text-lg font-bold">Personalizar ticket (80 mm)</h2>
        <p className="mt-1 text-sm text-base-content/60">
          Controla qué información sale al imprimir en mostrador.
        </p>
        <div className="mt-4 space-y-4">
          <label className="form-control">
            <span className="label-text text-xs font-medium">
              Mensaje al final del ticket
            </span>
            <input
              name="ticket_mensaje_pie"
              placeholder={TICKET_DEFAULTS.ticket_mensaje_pie}
              defaultValue={
                e.ticket_mensaje_pie ?? TICKET_DEFAULTS.ticket_mensaje_pie
              }
              className="input input-bordered input-sm w-full"
            />
          </label>
          <label className="form-control">
            <span className="label-text text-xs font-medium">
              Texto extra bajo el nombre (opcional)
            </span>
            <input
              name="ticket_texto_extra"
              placeholder="Ej. Horario: Lun–Sáb 8:00–20:00"
              defaultValue={e.ticket_texto_extra ?? ""}
              className="input input-bordered input-sm w-full"
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <TicketCheckbox
              name="ticket_mostrar_rfc"
              label="Mostrar RFC"
              defaultChecked={e.ticket_mostrar_rfc ?? true}
            />
            <TicketCheckbox
              name="ticket_mostrar_direccion"
              label="Mostrar dirección"
              defaultChecked={e.ticket_mostrar_direccion ?? true}
            />
            <TicketCheckbox
              name="ticket_mostrar_telefono"
              label="Mostrar teléfono"
              defaultChecked={e.ticket_mostrar_telefono ?? true}
            />
            <TicketCheckbox
              name="ticket_mostrar_cliente"
              label="Mostrar cliente"
              defaultChecked={e.ticket_mostrar_cliente ?? true}
            />
            <TicketCheckbox
              name="ticket_mostrar_iva"
              label="Desglosar IVA"
              defaultChecked={e.ticket_mostrar_iva ?? true}
            />
            <TicketCheckbox
              name="ticket_mostrar_forma_pago"
              label="Mostrar forma de pago"
              defaultChecked={e.ticket_mostrar_forma_pago ?? true}
            />
          </div>
        </div>
      </section>

      <button type="submit" className="btn btn-primary touch-manipulation min-h-11">
        Guardar datos del negocio
      </button>
    </form>
  )
}
