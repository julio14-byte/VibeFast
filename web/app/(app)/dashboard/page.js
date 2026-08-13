import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { formatPrecio } from "@/lib/productos"
import { createProducto, updateProducto, deleteProducto } from "./actions"

export const metadata = { title: "Productos · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function DashboardPage({ searchParams }) {
  let productos = null
  let proveedores = []
  let error = null

  if (!isSupabaseConfigured()) {
    error = {
      message:
        "Supabase no está configurado. Agrega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    }
  } else {
    try {
      const supabase = await createClient()
      const [productosRes, proveedoresRes] = await Promise.all([
        supabase
          .from("productos")
          .select("*, proveedor:proveedores(id, nombre)")
          .order("created_at", { ascending: false }),
        supabase.from("proveedores").select("id, nombre").order("nombre"),
      ])
      productos = productosRes.data
      proveedores = proveedoresRes.data ?? []
      error = productosRes.error
    } catch (err) {
      error = { message: err.message }
    }
  }

  const params = await searchParams
  const editId = params?.edit?.toString()
  const formError = params?.error?.toString()
  const ok = params?.ok?.toString()
  const editProducto = editId
    ? productos?.find((p) => p.id === editId) ?? null
    : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="mt-1 text-sm text-base-content/70">
            Catálogo de ferretería con precios de compra, mayoreo y público,
            stock y proveedor.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/proveedores" className="btn btn-outline btn-sm">
            Proveedores
          </Link>
          <Link href="/inventario" className="btn btn-outline btn-sm">
            Inventario
          </Link>
        </div>
      </div>

      {formError && (
        <div role="alert" className="alert alert-error">
          <span>{formError}</span>
        </div>
      )}
      {ok && !formError && (
        <div role="alert" className="alert alert-success">
          <span>
            {ok === "creado" && "Producto agregado."}
            {ok === "actualizado" && "Producto actualizado."}
            {ok === "eliminado" && "Producto eliminado."}
          </span>
        </div>
      )}

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

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input
            name="codigo"
            type="number"
            required
            min="0"
            step="1"
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
            placeholder="Nombre del producto"
            aria-label="Nombre del producto"
            className="input input-bordered sm:col-span-2"
          />
          <select
            name="proveedor_id"
            aria-label="Proveedor"
            className="select select-bordered"
            defaultValue={editProducto?.proveedor_id ?? ""}
          >
            <option value="">Sin proveedor</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <input
            name="precio_compra"
            type="number"
            min="0"
            step="0.01"
            defaultValue={editProducto?.precio_compra ?? ""}
            placeholder="Precio compra"
            aria-label="Precio de compra"
            className="input input-bordered"
          />
          <input
            name="precio_mayoreo"
            type="number"
            min="0"
            step="0.01"
            defaultValue={editProducto?.precio_mayoreo ?? ""}
            placeholder="Precio mayoreo"
            aria-label="Precio mayoreo"
            className="input input-bordered"
          />
          <input
            name="precio_publico"
            type="number"
            required
            min="0"
            step="0.01"
            defaultValue={
              editProducto?.precio_publico ?? editProducto?.precio ?? ""
            }
            placeholder="Precio público"
            aria-label="Precio público"
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
            aria-label="Stock"
            className="input input-bordered"
          />
          <input
            name="clave_sat"
            type="text"
            maxLength={8}
            defaultValue={editProducto?.clave_sat ?? "01010101"}
            placeholder="Clave SAT"
            aria-label="Clave producto SAT"
            className="input input-bordered"
          />
        </div>

        <input
          name="unidad_sat"
          type="text"
          maxLength={4}
          defaultValue={editProducto?.unidad_sat ?? "H87"}
          placeholder="Unidad SAT (H87)"
          aria-label="Unidad SAT"
          className="input input-bordered mt-2 w-full sm:w-48"
        />

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

      {!productos?.length ? (
        <div className="rounded-box border border-dashed border-base-300 bg-base-100 px-4 py-12 text-center text-base-content/60">
          Aún no tienes productos. Agrega el primero arriba o usa el{" "}
          <Link href="/chat" className="link link-primary">chat</Link>.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-box border border-base-200 bg-base-100">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Proveedor</th>
                <th className="text-right">Compra</th>
                <th className="text-right">Mayoreo</th>
                <th className="text-right">Público</th>
                <th className="text-right">Stock</th>
                <th className="w-24 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto) => (
                <tr key={producto.id}>
                  <td className="font-mono text-sm tabular-nums">{producto.codigo}</td>
                  <td className="font-medium">{producto.nombre}</td>
                  <td className="text-sm text-base-content/70">
                    {producto.proveedor?.nombre ?? "—"}
                  </td>
                  <td className="text-right text-sm">
                    {formatPrecio(producto.precio_compra)}
                  </td>
                  <td className="text-right text-sm">
                    {formatPrecio(producto.precio_mayoreo)}
                  </td>
                  <td className="text-right font-medium">
                    {formatPrecio(producto.precio_publico ?? producto.precio)}
                  </td>
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
                        title="Editar"
                        aria-label={`Editar ${producto.nombre}`}
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <form action={deleteProducto}>
                        <input type="hidden" name="id" value={producto.id} />
                        <button
                          type="submit"
                          className="btn btn-ghost btn-sm btn-square text-error"
                          title="Eliminar"
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
