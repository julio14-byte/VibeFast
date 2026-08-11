import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createProducto, updateProducto, deleteProducto } from "./actions"

export const metadata = { title: "Productos · SmartPOS" }
export const dynamic = "force-dynamic"

function formatPrecio(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value)
}

export default async function DashboardPage({ searchParams }) {
  let productos = null
  let error = null

  if (!isSupabaseConfigured()) {
    error = {
      message:
        "Supabase no está configurado en el servidor. Agrega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel.",
    }
  } else {
    try {
      const supabase = await createClient()
      const result = await supabase
        .from("productos")
        .select("*")
        .order("created_at", { ascending: false })
      productos = result.data
      error = result.error
    } catch (err) {
      error = { message: err.message }
    }
  }

  const params = await searchParams
  const editId = params?.edit?.toString()
  const editProducto = editId
    ? productos?.find((p) => p.id === editId) ?? null
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
        <p className="mt-1 text-sm text-base-content/70">
          Catálogo e inventario de SmartPOS. Administra nombre, código, precio y
          existencias de cada producto.
        </p>
      </div>

      {/* Crear / editar */}
      <form
        action={editProducto ? updateProducto : createProducto}
        className="rounded-box border border-base-200 bg-base-100 p-4"
      >
        {editProducto && (
          <input type="hidden" name="id" value={editProducto.id} />
        )}

        <p className="mb-3 text-sm font-medium">
          {editProducto ? "Editar producto" : "Nuevo producto"}
        </p>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <input
            name="codigo"
            required
            maxLength={40}
            defaultValue={editProducto?.codigo ?? ""}
            placeholder="Código"
            aria-label="Código del producto"
            className="input input-bordered"
          />
          <input
            name="nombre"
            required
            maxLength={120}
            defaultValue={editProducto?.nombre ?? ""}
            placeholder="Nombre"
            aria-label="Nombre del producto"
            className="input input-bordered sm:col-span-2"
          />
          <input
            name="precio"
            type="number"
            required
            min="0"
            step="0.01"
            defaultValue={editProducto?.precio ?? ""}
            placeholder="Precio"
            aria-label="Precio del producto"
            className="input input-bordered"
          />
          <input
            name="stock"
            type="number"
            required
            min="0"
            step="1"
            defaultValue={editProducto?.stock ?? ""}
            placeholder="Stock"
            aria-label="Stock del producto"
            className="input input-bordered"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary">
            {editProducto ? "Guardar cambios" : "Agregar producto"}
          </button>
          {editProducto && (
            <Link href="/dashboard" className="btn btn-ghost">
              Cancelar
            </Link>
          )}
        </div>
      </form>

      {error && (
        <div className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          No pudimos cargar tus productos: {error.message}
        </div>
      )}

      {/* Lista */}
      {!productos?.length ? (
        <div className="rounded-box border border-dashed border-base-300 bg-base-100 px-4 py-12 text-center text-base-content/60">
          Aún no tienes productos. Agrega el primero arriba.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-box border border-base-200 bg-base-100">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th className="text-right">Precio</th>
                <th className="text-right">Stock</th>
                <th className="w-24 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto) => (
                <tr key={producto.id}>
                  <td className="font-mono text-sm">{producto.codigo}</td>
                  <td className="font-medium">{producto.nombre}</td>
                  <td className="text-right">{formatPrecio(producto.precio)}</td>
                  <td className="text-right">
                    <span
                      className={`badge badge-sm ${
                        producto.stock === 0
                          ? "badge-error"
                          : producto.stock <= 5
                            ? "badge-warning"
                            : "badge-success"
                      }`}
                    >
                      {producto.stock}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/dashboard?edit=${producto.id}`}
                        className="btn btn-ghost btn-sm btn-square"
                        title="Editar producto"
                        aria-label={`Editar ${producto.nombre}`}
                      >
                        <Pencil className="size-4" />
                      </Link>

                      <form action={deleteProducto}>
                        <input type="hidden" name="id" value={producto.id} />
                        <button
                          type="submit"
                          className="btn btn-ghost btn-sm btn-square text-error"
                          title="Eliminar producto"
                          aria-label={`Eliminar ${producto.nombre}`}
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
