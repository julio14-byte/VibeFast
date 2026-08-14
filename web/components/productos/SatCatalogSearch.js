"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Search, X } from "lucide-react"

const DEBOUNCE_MS = 280

/**
 * Buscador de catálogos SAT (clave producto/servicio o unidad).
 */
export default function SatCatalogSearch({
  type = "clave-prodserv",
  value,
  onChange,
  label,
  hint,
  placeholder,
  required,
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState("")
  const debounceRef = useRef(null)
  const inputRef = useRef(null)

  const endpoint =
    type === "unidad" ? "/api/sat/unidad" : "/api/sat/clave-prodserv"

  const fetchResults = useCallback(
    async (q) => {
      const trimmed = q.trim()
      if (trimmed.length < (type === "unidad" ? 1 : 2)) {
        setResults([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({ q: trimmed, limit: "15" })
        const res = await fetch(`${endpoint}?${params}`, {
          credentials: "include",
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body.error || `Error ${res.status}`)
        setResults(body.resultados ?? [])
        setOpen(true)
      } catch (err) {
        setResults([])
        setError(err?.message ?? "No se pudo buscar en el catálogo SAT.")
      } finally {
        setLoading(false)
      }
    },
    [endpoint, type]
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) {
      setResults([])
      setError(null)
      return undefined
    }

    debounceRef.current = setTimeout(() => fetchResults(query), DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, fetchResults])

  function selectItem(item) {
    const clave = item.clave
    onChange?.(clave, item)
    setSelectedLabel(
      type === "unidad" ? item.nombre : item.descripcion
    )
    setQuery("")
    setResults([])
    setOpen(false)
  }

  useEffect(() => {
    if (!value) setSelectedLabel("")
  }, [value])

  const displayLabel = selectedLabel

  return (
    <div className="form-control w-full">
      {label ? (
        <label className="label py-1">
          <span className="label-text font-medium">
            {label}
            {required ? <span className="text-error"> *</span> : null}
          </span>
        </label>
      ) : null}

      <input type="hidden" name={type === "unidad" ? "unidad_sat" : "clave_sat"} value={value ?? ""} readOnly />

      {value ? (
        <div className="flex items-start gap-2 rounded-lg border border-base-200 bg-base-200/40 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm font-medium">{value}</p>
            {displayLabel ? (
              <p className="text-xs text-base-content/60 truncate">{displayLabel}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onChange?.("", null)}
            className="btn btn-ghost btn-xs btn-square shrink-0"
            aria-label="Cambiar clave SAT"
          >
            <X className="size-3" />
          </button>
        </div>
      ) : null}

      <label className="input input-bordered flex items-center gap-2 mt-1">
        <Search className="size-4 shrink-0 opacity-60" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder={
            placeholder ??
            (type === "unidad"
              ? "Buscar unidad SAT (ej. pieza, metro)…"
              : "Buscar clave SAT por código o descripción…")
          }
          className="grow bg-transparent outline-none text-sm"
          aria-label={label ?? "Buscar catálogo SAT"}
        />
        {loading && (
          <span className="loading loading-spinner loading-xs shrink-0" aria-hidden />
        )}
      </label>

      {hint ? <p className="mt-1 text-xs text-base-content/55">{hint}</p> : null}

      {error && <p className="mt-1 text-xs text-error">{error}</p>}

      {open && results.length > 0 && (
        <ul
          className="mt-1 max-h-48 overflow-y-auto rounded-box border border-base-200 bg-base-100 shadow-sm divide-y divide-base-200"
        >
          {results.map((item) => (
            <li key={item.clave}>
              <button
                type="button"
                onClick={() => selectItem(item)}
                className="flex w-full gap-2 px-3 py-2 text-left text-sm hover:bg-base-200/60 touch-manipulation"
              >
                <span className="font-mono shrink-0 text-primary">{item.clave}</span>
                <span className="min-w-0 truncate text-base-content/80">
                  {type === "unidad" ? item.nombre : item.descripcion}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
