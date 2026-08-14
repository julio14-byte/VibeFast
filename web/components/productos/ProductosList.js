"use client"

import Link from "next/link"

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
          <Link
            href={hrefFor(prev)}
            className="btn btn-outline btn-sm touch-manipulation"
          >
            Anterior
          </Link>
        ) : (
          <span className="btn btn-outline btn-sm btn-disabled">Anterior</span>
        )}
        {next ? (
          <Link
            href={hrefFor(next)}
            className="btn btn-outline btn-sm touch-manipulation"
          >
            Siguiente
          </Link>
        ) : (
          <span className="btn btn-outline btn-sm btn-disabled">Siguiente</span>
        )}
      </div>
    </nav>
  )
}
