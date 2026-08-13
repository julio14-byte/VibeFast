"use client"

import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import { filterProductos } from "@/lib/productos"

export default function ProductSearch({
  productos,
  onSelect,
  placeholder = "Buscar por nombre, código o proveedor…",
  showResults = true,
  className = "",
}) {
  const [query, setQuery] = useState("")

  const results = useMemo(
    () => filterProductos(productos, query).slice(0, 12),
    [productos, query]
  )

  return (
    <div className={className}>
      <label className="input input-bordered flex items-center gap-2">
        <Search className="size-4 shrink-0 opacity-60" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="grow bg-transparent outline-none text-base sm:text-sm"
          aria-label="Buscar productos"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="btn btn-ghost btn-xs btn-square"
            aria-label="Limpiar búsqueda"
          >
            <X className="size-3" />
          </button>
        )}
      </label>

      {showResults && query.trim() && (
        <div className="mt-2 rounded-box border border-base-200 bg-base-100 shadow-sm">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-base-content/60">
              No se encontraron productos con &quot;{query}&quot;
            </p>
          ) : (
            <ul className="divide-y divide-base-200">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect?.(p)
                      setQuery("")
                    }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left touch-manipulation active:bg-base-200/60"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p.nombre}</p>
                      <p className="text-xs text-base-content/60">
                        Código {p.codigo}
                        {p.proveedor?.nombre && ` · ${p.proveedor.nombre}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`badge badge-sm ${
                          p.stock === 0
                            ? "badge-error"
                            : p.stock <= 5
                              ? "badge-warning"
                              : "badge-success"
                        }`}
                      >
                        {p.stock}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
