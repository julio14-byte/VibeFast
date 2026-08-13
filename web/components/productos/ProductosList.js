"use client"

import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"
import { formatPrecio } from "@/lib/productos"
import { deleteProducto } from "@/app/(app)/productos/actions"

export default function ProductosPagination({
  page,
  totalPages,
  total,
  query,
}) {
  if (totalPages <= 1) return null

  function hrefFor(p) {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (p > 1) params.set("page", String(p))
    const qs = params.toString()
    return qs ? `/productos?${qs}` : "/productos"
  }

  const prev = page > 1 ? page - 1 : null
  const next = page < totalPages ? page + 1 : null

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 border-t border-base-200 px-4 py-3 text-sm"
      aria-label="Paginación de productos"
    >
      <span className="text-base-content/60">
        {total} producto{total === 1 ? "" : "s"} · página {page} de {totalPages}
      </span>
      <div className="flex gap-2">
        {prev ? (
          <Link href={hrefFor(prev)} className="btn btn-outline btn-sm touch-manipulation">
            Anterior
          </Link>
        ) : (
          <span className="btn btn-outline btn-sm btn-disabled">Anterior</span>
        )}
        {next ? (
          <Link href={hrefFor(next)} className="btn btn-outline btn-sm touch-manipulation">
            Siguiente
          </Link>
        ) : (
          <span className="btn btn-outline btn-sm btn-disabled">Siguiente</span>
        )}
      </div>
    </nav>
  )
}

export function ProductosTable({ productos }) {
  if (!productos?.length) {
    return (
      <p className="px-4 py-12 text-center text-sm text-base-content/60">
        Sin productos en esta página.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
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
              <td className="font-medium max-w-[200px] truncate sm:max-w-xs">
                {producto.nombre}
              </td>
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
                    href={`/productos?edit=${producto.id}`}
                    className="btn btn-ghost btn-sm btn-square touch-manipulation"
                    aria-label={`Editar ${producto.nombre}`}
                  >
                    <Pencil className="size-4" />
                  </Link>
                  <form action={deleteProducto}>
                    <input type="hidden" name="id" value={producto.id} />
                    <button
                      type="submit"
                      className="btn btn-ghost btn-sm btn-square text-error touch-manipulation"
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
  )
}
