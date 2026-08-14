"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { filterProductos } from "@/lib/productos"

const DEBOUNCE_MS = 280

/**
 * Buscador de productos.
 * - serverSearch=true: consulta /api/productos/search (escala a miles de productos).
 * - productos prop: filtrado local (legacy / listas pequeñas).
 */
export default function ProductSearch({
  productos,
  onSelect,
  placeholder = "Buscar por código o nombre…",
  showResults = true,
  className = "",
  serverSearch = !productos,
  limit = 12,
}) {
  const [query, setQuery] = useState("")
  const [serverResults, setServerResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState(null)
  const debounceRef = useRef(null)

  const localResults = useMemo(
    () => (productos ? filterProductos(productos, query).slice(0, limit) : []),
    [productos, query, limit]
  )

  const fetchServer = useCallback(
    async (q) => {
      if (!serverSearch) return
      const trimmed = q.trim()
      if (!trimmed) {
        setServerResults([])
        setServerError(null)
        return
      }

      setLoading(true)
      setServerError(null)

      try {
        const params = new URLSearchParams({
          q: trimmed,
          limit: String(limit),
        })
        const res = await fetch(`/api/productos/search?${params}`, {
          credentials: "include",
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(body.error || `Error ${res.status}`)
        }
        setServerResults(body.productos ?? [])
      } catch (err) {
        setServerResults([])
        setServerError(err?.message ?? "No se pudo buscar.")
      } finally {
        setLoading(false)
      }
    },
    [serverSearch, limit]
  )

  useEffect(() => {
    if (!serverSearch) return undefined

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) {
      setServerResults([])
      setServerError(null)
      setLoading(false)
      return undefined
    }

    debounceRef.current = setTimeout(() => fetchServer(query), DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, serverSearch, fetchServer])

  const results = serverSearch ? serverResults : localResults
  const showPanel = showResults && query.trim()

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
        {loading && (
          <span className="loading loading-spinner loading-xs shrink-0" aria-hidden />
        )}
        {query && !loading && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="btn btn-ghost btn-xs btn-square touch-manipulation"
            aria-label="Limpiar búsqueda"
          >
            <X className="size-3" />
          </button>
        )}
      </label>

      {showPanel && (
        <div className="mt-2 rounded-box border border-base-200 bg-base-100 shadow-sm">
          {serverError && (
            <p className="px-4 py-3 text-sm text-error">{serverError}</p>
          )}
          {!serverError && results.length === 0 && !loading && (
            <p className="px-4 py-3 text-sm text-base-content/60">
              No se encontraron productos con &quot;{query}&quot;
            </p>
          )}
          {!serverError && results.length > 0 && (
            <ul className="divide-y divide-base-200">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect?.(p)
                      setQuery("")
                      setServerResults([])
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