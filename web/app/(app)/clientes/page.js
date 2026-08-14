import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { SAT_REGIMENES, SAT_USOS_CFDI } from "@/lib/productos"
import { createCliente, updateCliente, deleteCliente } from "./actions"

export const metadata = { title: "Clientes · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function ClientesPage({ searchParams }) {
  const supabase = await createClient()
  const { data: clientes, error } = await supabase
    .from("clientes")
    .select("*")
    .order("razon_social", { ascending: true })

  const params = await searchParams
  const editId = params?.edit?.toString()
  const formError = params?.error?.toString()
  const ok = params?.ok?.toString()
  const editCliente = editId
    ? clientes?.find((c) => c.id === editId) ?? null
    : null

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-base-content/70">
            RFC, razón social, dirección y correo para ventas y facturación
            electrónica SAT.
          </p>
        </div>
        <Link href="/facturacion" className="btn btn-outline btn-sm">
          Facturación
        </Link>
      </div>

      {formError && (
        <div role="alert" className="alert alert-error">
          <span>{formError}</span>
        </div>
      )}
      {ok && !formError && (
        <div role="alert" className="alert alert-success">
          <span>
            {ok === "creado" && "Cliente registrado."}
            {ok === "actualizado" && "Cliente actualizado."}
            {ok === "eliminado" && "Cliente eliminado."}
          </span>
        </div>
      )}

      <form
        action={editCliente ? updateCliente : createCliente}
        className="rounded-box border border-base-200 bg-base-100 p-4 space-y-2"
      >
        {editCliente && (
          <input type="hidden" name="id" value={editCliente.id} />
        )}
        <p className="text-sm font-medium">
          {editCliente ? "Editar cliente" : "Nuevo cliente"}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            name="razon_social"
            required
            placeholder="Razón social"
            defaultValue={editCliente?.razon_social ?? editCliente?.nombre ?? ""}
            className="input input-bordered input-sm"
            aria-label="Razón social"
          />
          <input
            name="nombre"
            placeholder="Nombre corto (opcional)"
            defaultValue={editCliente?.nombre ?? ""}
            className="input input-bordered input-sm"
            aria-label="Nombre"
          />
          <input
            name="rfc"
            required
            placeholder="RFC"
            defaultValue={editCliente?.rfc ?? ""}
            className="input input-bordered input-sm font-mono"
            aria-label="RFC"
          />
          <input
            name="email"
            type="email"
            placeholder="Correo electrónico"
            defaultValue={editCliente?.email ?? ""}
            className="input input-bordered input-sm"
            aria-label="Email"
          />
          <input
            name="codigo_postal"
            required
            placeholder="Código postal"
            defaultValue={editCliente?.codigo_postal ?? ""}
            className="input input-bordered input-sm"
            aria-label="Código postal"
          />
          <input
            name="telefono"
            placeholder="Teléfono"
            defaultValue={editCliente?.telefono ?? ""}
            className="input input-bordered input-sm"
            aria-label="Teléfono"
          />
          <textarea
            name="direccion"
            placeholder="Dirección fiscal"
            defaultValue={editCliente?.direccion ?? ""}
            className="textarea textarea-bordered textarea-sm sm:col-span-2"
            rows={2}
            aria-label="Dirección"
          />
          <select
            name="regimen_fiscal"
            defaultValue={editCliente?.regimen_fiscal ?? "616"}
            className="select select-bordered select-sm"
            aria-label="Régimen fiscal"
          >
            {SAT_REGIMENES.map((r) => (
              <option key={r.clave} value={r.clave}>
                {r.clave} — {r.nombre}
              </option>
            ))}
          </select>
          <select
            name="uso_cfdi"
            defaultValue={editCliente?.uso_cfdi ?? "G03"}
            className="select select-bordered select-sm"
            aria-label="Uso CFDI"
          >
            {SAT_USOS_CFDI.map((u) => (
              <option key={u.clave} value={u.clave}>
                {u.clave} — {u.nombre}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-start gap-3 rounded-lg border border-base-200 bg-base-200/30 p-3 cursor-pointer">
          <input
            type="checkbox"
            name="usa_precio_mayoreo"
            value="1"
            defaultChecked={Boolean(editCliente?.usa_precio_mayoreo)}
            className="checkbox checkbox-sm checkbox-primary mt-0.5"
          />
          <span className="text-sm">
            <span className="font-medium">Precio mayoreo en ventas</span>
            <span className="block text-xs text-base-content/60 mt-0.5">
              Si está marcado, al seleccionar este cliente en Ventas se aplicará
              el precio mayoreo del catálogo. Desmarcado = precio público
              (menudeo).
            </span>
          </span>
        </label>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary btn-sm">
            {editCliente ? "Guardar" : "Agregar cliente"}
          </button>
          {editCliente && (
            <Link href="/clientes" className="btn btn-ghost btn-sm">
              Cancelar
            </Link>
          )}
        </div>
      </form>

      {error && (
        <div role="alert" className="alert alert-error">
          <span>{error.message}</span>
        </div>
      )}

      {!clientes?.length ? (
        <p className="text-center text-base-content/60 py-8">
          Sin clientes. Agrega el primero para facturar.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-box border border-base-200 bg-base-100">
          <table className="table">
            <thead>
              <tr>
                <th>Razón social</th>
                <th>RFC</th>
                <th>Precio ventas</th>
                <th>Email</th>
                <th>CP</th>
                <th>Dirección</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">
                    {c.razon_social ?? c.nombre}
                  </td>
                  <td className="font-mono text-sm">{c.rfc}</td>
                  <td>
                    <span
                      className={`badge badge-sm ${
                        c.usa_precio_mayoreo ? "badge-primary" : "badge-ghost"
                      }`}
                    >
                      {c.usa_precio_mayoreo ? "Mayoreo" : "Menudeo"}
                    </span>
                  </td>
                  <td className="text-sm">{c.email ?? "—"}</td>
                  <td className="text-sm">{c.codigo_postal ?? "—"}</td>
                  <td className="text-sm max-w-[200px] truncate">
                    {c.direccion ?? "—"}
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/clientes?edit=${c.id}`}
                        className="btn btn-ghost btn-sm btn-square"
                        aria-label="Editar"
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <form action={deleteCliente}>
                        <input type="hidden" name="id" value={c.id} />
                        <button
                          type="submit"
                          className="btn btn-ghost btn-sm btn-square text-error"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
