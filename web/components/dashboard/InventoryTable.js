"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, X, ArrowUpDown, PackageSearch } from "lucide-react"
import { formatPrecio, filterProductos } from "@/lib/productos"
import { getStockStatus } from "@/lib/dashboard/metrics"

export default function InventoryTable({ productos }) {
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState("nombre")
  const [sortDir, setSortDir] = useState("asc")

  const filtered = useMemo(() => {
    let list = filterProductos(productos, query)

    list = [...list].sort((a, b) => {
      let av, bv
      switch (sortKey) {
        case "codigo":
          av = Number(a.codigo)
          bv = Number(b.codigo)
          break
        case "precio":
          av = Number(a.precio_publico ?? a.precio ?? 0)
          bv = Number(b.precio_publico ?? b.precio ?? 0)
          break
        case "stock":
          av = Number(a.stock)
          bv = Number(b.stock)
          break
        default:
          av = a.nombre?.toLowerCase() ?? ""
          bv = b.nombre?.toLowerCase() ?? ""
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    })

    return list
  }, [productos, query, sortKey, sortDir])

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir(key === "stock" ? "desc" : "asc")
    }
  }

  return (
    <section
      className="dashboard-table overflow-hidden rounded-2xl border border-base-300/80 bg-base-100 shadow-sm"
      aria-label="Tabla de inventario"
    >
      <div className="border-b border-base-200 bg-base-200/40 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Inventario en vivo</h2>
            <p className="text-sm text-base-content/60">
              {filtered.length} de {productos.length} productos
            </p>
          </div>
          <label className="input input-bordered flex items-center gap-2 w-full sm:w-72 bg-base-100">
            <Search className="size-4 shrink-0 opacity-50" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o código…"
              className="grow bg-transparent outline-none text-sm"
              aria-label="Buscar productos"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="btn btn-ghost btn-xs btn-square"
                aria-label="Limpiar"
              >
                <X className="size-3" />
              </button>
            )}
          </label>
        </div>
      </div>

      {productos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <PackageSearch className="size-10 text-base-content/30" />
          <p className="text-base-content/60">No hay productos en el catálogo.</p>
          <Link href="/productos" className="btn btn-primary btn-sm">
            Agregar primer producto
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-pin-rows">
            <thead>
              <tr className="bg-base-200/60 text-xs uppercase tracking-wide text-base-content/55">
                <th>
                  <button
                    type="button"
                    onClick={() => toggleSort("codigo")}
                    className="flex items-center gap-1 font-semibold hover:text-primary"
                  >
                    Código
                    <ArrowUpDown className="size-3" />
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    onClick={() => toggleSort("nombre")}
                    className="flex items-center gap-1 font-semibold hover:text-primary"
                  >
                    Nombre
                    <ArrowUpDown className="size-3" />
                  </button>
                </th>
                <th className="text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort("precio")}
                    className="flex items-center justify-end gap-1 font-semibold hover:text-primary w-full"
                  >
                    Precio
                    <ArrowUpDown className="size-3" />
                  </button>
                </th>
                <th className="text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort("stock")}
                    className="flex items-center justify-end gap-1 font-semibold hover:text-primary w-full"
                  >
                    Stock
                    <ArrowUpDown className="size-3" />
                  </button>
                </th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-base-content/50">
                    Sin resultados para &quot;{query}&quot;
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const status = getStockStatus(p.stock)
                  const precio = p.precio_publico ?? p.precio
                  const isCritical = status.level === "critical"

                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors hover:bg-base-200/50 ${
                        isCritical ? "bg-warning/5" : ""
                      }`}
                    >
                      <td className="font-mono text-sm font-medium tabular-nums">
                        {p.codigo}
                      </td>
                      <td>
                        <p className="font-medium leading-snug max-w-[280px] truncate sm:max-w-md">
                          {p.nombre}
                        </p>
                      </td>
                      <td className="text-right font-semibold tabular-nums">
                        {formatPrecio(precio)}
                      </td>
                      <td className="text-right">
                        <span className="inline-flex items-center justify-end gap-2 tabular-nums font-bold">
                          <span
                            className={`size-2 rounded-full ${status.dotClass}`}
                            aria-hidden
                          />
                          {p.stock}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-sm ${status.badgeClass}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-base-200 px-4 py-3 text-xs text-base-content/50 sm:px-5">
        <span>Orden: {sortKey} ({sortDir})</span>
        <Link href="/inventario" className="link link-primary link-hover">
          Ver inventario completo →
        </Link>
      </div>
    </section>
  )
}
