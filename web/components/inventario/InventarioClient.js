"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import ProductSearch from "@/components/inventario/ProductSearch"
import { formatPrecio } from "@/lib/productos"

function InventarioPagination({ page, totalPages, query }) {
  if (totalPages <= 1) return null

  function hrefFor(p) {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (p > 1) params.set("page", String(p))
    const qs = params.toString()
    return qs ? `/inventario?${qs}` : "/inventario"
  }

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 border-t border-base-200 px-4 py-3 text-sm"
      aria-label="Paginación inventario"
    >
      <span className="text-base-content/60">Página {page} de {totalPages}</span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className="btn btn-outline btn-sm touch-manipulation">
            Anterior
          </Link>
        ) : (
          <span className="btn btn-outline btn-sm btn-disabled">Anterior</span>
        )}
        {page < totalPages ? (
          <Link href={hrefFor(page + 1)} className="btn btn-outline btn-sm touch-manipulation">
            Siguiente
          </Link>
        ) : (
          <span className="btn btn-outline btn-sm btn-disabled">Siguiente</span>
        )}
      </div>
    </nav>
  )
}

export default function InventarioClient({
  productos,
  alertasCount,
  page,
  totalPages,
  total,
  query,
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Inventario</h1>
          <p className="page-lead">
            Búsqueda en servidor (escala a miles de productos). Lista paginada
            de {total} en catálogo.
          </p>
        </div>
        <Link
          href="/chat"
          className="btn btn-primary btn-sm shrink-0 touch-manipulation"
        >
          Buscar con chat
        </Link>
      </div>

      <form action="/inventario" method="get" className="flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Filtrar lista por nombre o código…"
          className="input input-bordered input-sm w-full max-w-md"
          aria-label="Filtrar inventario"
        />
        <button type="submit" className="btn btn-outline btn-sm touch-manipulation">
          Filtrar
        </button>
        {query && (
          <Link href="/inventario" className="btn btn-ghost btn-sm touch-manipulation">
            Limpiar filtro
          </Link>
        )}
      </form>

      <ProductSearch
        serverSearch
        onSelect={(p) => {
          window.location.href = `/inventario?q=${encodeURIComponent(String(p.codigo))}`
        }}
        placeholder="Búsqueda rápida (POS / mostrador)…"
      />

      {query && (
        <p className="text-sm text-base-content/60">
          Filtro activo: &quot;{query}&quot; — {total} resultado{total === 1 ? "" : "s"}
        </p>
      )}

      {alertasCount > 0 && (
        <div role="alert" className="alert alert-warning">
          <AlertTriangle className="size-5 shrink-0" />
          <span>
            {alertasCount} producto{alertasCount === 1 ? "" : "s"} con stock
            bajo (menos de 2 unidades).
          </span>
        </div>
      )}

      {total === 0 ? (
        <div className="rounded-box border border-dashed border-base-300 bg-base-100 px-4 py-12 text-center">
          <p className="text-base-content/70">
            {query
              ? "No hay productos que coincidan con la búsqueda."
              : "Aún no hay productos. Importa un CSV en Productos."}
          </p>
          {!query && (
            <Link href="/productos" className="btn btn-primary btn-sm mt-4 touch-manipulation">
              Ir a Productos
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {productos.map((p) => (
              <article
                key={p.id}
                className="rounded-box border border-base-200 bg-base-100 p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium leading-snug">{p.nombre}</p>
                    <p className="mt-0.5 font-mono text-xs text-base-content/55">
                      Cód. {p.codigo}
                    </p>
                  </div>
                  <span
                    className={`badge shrink-0 ${
                      p.stock === 0
                        ? "badge-error"
                        : p.stock < 2
                          ? "badge-warning"
                          : "badge-success"
                    }`}
                  >
                    {p.stock} u.
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-base-content/70">
                  <span>Público {formatPrecio(p.precio_publico ?? p.precio)}</span>
                  <span>Mayoreo {formatPrecio(p.precio_mayoreo)}</span>
                  {p.proveedor?.nombre && <span>{p.proveedor.nombre}</span>}
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-box border border-base-200 bg-base-100 md:block">
            <div className="overflow-x-auto">
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
                  {productos.map((p) => (
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
            </div>
            <InventarioPagination page={page} totalPages={totalPages} query={query} />
          </div>

          <div className="md:hidden">
            <InventarioPagination page={page} totalPages={totalPages} query={query} />
          </div>
        </>
      )}
    </div>
  )
}
