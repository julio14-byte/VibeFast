import Link from "next/link"
import { Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { createProveedor, deleteProveedor } from "../dashboard/actions"

export const metadata = { title: "Proveedores · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function ProveedoresPage({ searchParams }) {
  const supabase = await createClient()
  const { data: proveedores, error } = await supabase
    .from("proveedores")
    .select("*")
    .order("nombre")

  const params = await searchParams
  const formError = params?.error?.toString()
  const ok = params?.ok?.toString()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
          <p className="mt-1 text-sm text-base-content/70">
            Administra los proveedores de tu ferretería para vincularlos a
            productos.
          </p>
        </div>
        <Link href="/dashboard" className="btn btn-outline btn-sm">
          Productos
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
            {ok === "creado" && "Proveedor agregado."}
            {ok === "eliminado" && "Proveedor eliminado."}
          </span>
        </div>
      )}

      <form
        action={createProveedor}
        className="rounded-box border border-base-200 bg-base-100 p-4 space-y-2"
      >
        <p className="text-sm font-medium">Nuevo proveedor</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            name="nombre"
            required
            placeholder="Nombre del proveedor"
            className="input input-bordered"
            aria-label="Nombre"
          />
          <input
            name="contacto"
            placeholder="Contacto"
            className="input input-bordered"
            aria-label="Contacto"
          />
          <input
            name="telefono"
            placeholder="Teléfono"
            className="input input-bordered"
            aria-label="Teléfono"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="input input-bordered"
            aria-label="Email"
          />
        </div>
        <textarea
          name="notas"
          placeholder="Notas"
          className="textarea textarea-bordered w-full"
          rows={2}
          aria-label="Notas"
        />
        <button type="submit" className="btn btn-primary btn-sm">
          Agregar proveedor
        </button>
      </form>

      {error && (
        <div role="alert" className="alert alert-error">
          <span>{error.message}</span>
        </div>
      )}

      {!proveedores?.length ? (
        <p className="text-center text-base-content/60 py-8">
          Sin proveedores registrados.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-box border border-base-200 bg-base-100">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {proveedores.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.nombre}</td>
                  <td>{p.contacto ?? "—"}</td>
                  <td>{p.telefono ?? "—"}</td>
                  <td>{p.email ?? "—"}</td>
                  <td>
                    <form action={deleteProveedor}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        className="btn btn-ghost btn-sm btn-square text-error"
                        aria-label={`Eliminar ${p.nombre}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </form>
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
