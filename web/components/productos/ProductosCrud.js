"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { formatPrecio } from "@/lib/productos"
import { deleteProducto } from "@/app/(app)/productos/actions"
import ProductoFormModal from "./ProductoFormModal"
import ProductosPagination from "./ProductosList"

export default function ProductosCrud({
  productos,
  pagination,
  query,
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(producto) {
    setEditing(producto)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form
          action="/productos"
          method="get"
          className="flex flex-wrap items-center gap-2"
        >
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Buscar por código o nombre…"
            className="input input-bordered input-sm w-full max-w-xs"
            aria-label="Buscar por código o nombre"
          />
          <button
            type="submit"
            className="btn btn-outline btn-sm touch-manipulation"
          >
            Buscar
          </button>
          {query && (
            <Link
              href="/productos"
              className="btn btn-ghost btn-sm touch-manipulation"
            >
              Limpiar
            </Link>
          )}
        </form>

        <button
          type="button"
          onClick={openCreate}
          className="btn btn-primary btn-sm gap-2 touch-manipulation min-h-11"
        >
          <Plus className="size-4" />
          Agregar producto
        </button>
      </div>

      {!pagination.total && !query ? null : (
        <div className="overflow-hidden rounded-box border border-base-200 bg-base-100">
          {productos?.length ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th className="text-right">Compra s/IVA</th>
                    <th className="text-right">Margen</th>
                    <th className="text-right">Mayoreo c/IVA</th>
                    <th className="text-right">Público c/IVA</th>
                    <th className="text-right">Stock</th>
                    <th className="w-24 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto) => (
                    <tr key={producto.id}>
                      <td className="font-mono text-sm tabular-nums">
                        {producto.codigo}
                      </td>
                      <td className="font-medium max-w-[200px] truncate sm:max-w-xs">
                        {producto.nombre}
                      </td>
                      <td className="text-right text-sm">
                        {formatPrecio(producto.precio_compra)}
                      </td>
                      <td className="text-right text-sm tabular-nums">
                        {producto.margen_ganancia != null
                          ? `${Number(producto.margen_ganancia)}%`
                          : "—"}
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
                          <button
                            type="button"
                            onClick={() => openEdit(producto)}
                            className="btn btn-ghost btn-sm btn-square touch-manipulation"
                            aria-label={`Editar ${producto.nombre}`}
                          >
                            <Pencil className="size-4" />
                          </button>
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
          ) : (
            <p className="px-4 py-12 text-center text-sm text-base-content/60">
              Sin resultados para &quot;{query}&quot;.
            </p>
          )}
          <ProductosPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            query={query}
          />
        </div>
      )}

      <ProductoFormModal
        open={modalOpen}
        onClose={closeModal}
        producto={editing}
      />
    </>
  )
}
