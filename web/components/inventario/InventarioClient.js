"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import ProductSearch from "@/components/inventario/ProductSearch"
import { formatPrecio, filterProductos } from "@/lib/productos"

export default function InventarioClient({ productos, alertasCount }) {
  const [filter, setFilter] = useState("")

  const filtered = useMemo(
    () => filterProductos(productos, filter),
    [productos, filter]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
          <p className="mt-1 text-sm text-base-content/70">
            Busca productos por nombre, código o proveedor. Precios de compra,
            mayoreo y público.
          </p>
        </div>
        <Link href="/chat" className="btn btn-primary btn-sm">
          Buscar con chat
        </Link>
      </div>

      <ProductSearch
        productos={productos}
        onSelect={(p) => setFilter(String(p.codigo))}
        placeholder="Buscar producto… (nombre, código, proveedor)"
      />

      {alertasCount > 0 && (
        <div role="alert" className="alert alert-warning">
          <AlertTriangle className="size-5" />
          <span>
            {alertasCount} producto{alertasCount === 1 ? "" : "s"} con stock
            bajo (menos de 2 unidades).
          </span>
        </div>
      )}

      <div className="overflow-x-auto rounded-box border border-base-200 bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Proveedor</th>
              <th className="text-right">Stock</th>
              <th className="text-right">Compra</th>
              <th className="text-right">Mayoreo</th>
              <th className="text-right">Público</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td className="font-mono tabular-nums text-sm">{p.codigo}</td>
                <td className="font-medium">{p.nombre}</td>
                <td className="text-sm text-base-content/70">
                  {p.proveedor?.nombre ?? "—"}
                </td>
                <td className="text-right">
                  <span
                    className={`badge badge-sm ${
                      p.stock === 0
                        ? "badge-error"
                        : p.stock < 2
                          ? "badge-warning"
                          : "badge-success"
                    }`}
                  >
                    {p.stock}
                  </span>
                </td>
                <td className="text-right text-sm">
                  {formatPrecio(p.precio_compra)}
                </td>
                <td className="text-right text-sm">
                  {formatPrecio(p.precio_mayoreo)}
                </td>
                <td className="text-right font-medium">
                  {formatPrecio(p.precio_publico ?? p.precio)}
                </td>
                <td>
                  {p.stock === 0 ? (
                    <span className="text-sm text-error">Agotado</span>
                  ) : p.stock < 2 ? (
                    <span className="text-sm text-warning">Bajo</span>
                  ) : (
                    <span className="text-sm text-success">OK</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-base-content/60">
            No hay productos que coincidan con tu búsqueda.
          </p>
        )}
      </div>
    </div>
  )
}
