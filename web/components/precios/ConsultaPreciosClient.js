"use client"

import { useState } from "react"
import { Pencil, Tag } from "lucide-react"
import ProductSearch from "@/components/inventario/ProductSearch"
import ProductoFormModal from "@/components/productos/ProductoFormModal"
import { formatPrecio } from "@/lib/productos"

function stockBadgeClass(stock) {
  if (stock === 0) return "badge-error"
  if (stock <= 5) return "badge-warning"
  return "badge-success"
}

function PriceRow({ label, value, highlight }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 ${
        highlight ? "bg-primary/10 border border-primary/20" : "bg-base-200/40"
      }`}
    >
      <span className="text-sm text-base-content/70">{label}</span>
      <span
        className={`text-base font-semibold tabular-nums ${
          highlight ? "text-primary" : ""
        }`}
      >
        {value}
      </span>
    </div>
  )
}

export default function ConsultaPreciosClient() {
  const [selected, setSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  function handleSelect(producto) {
    setSelected(producto)
  }

  const publico = selected?.precio_publico ?? selected?.precio
  const mayoreo = selected?.precio_mayoreo

  return (
    <>
      <div className="mx-auto max-w-2xl space-y-6">
        <ProductSearch
          serverSearch
          onSelect={handleSelect}
          placeholder="Busca por código o nombre…"
          className="[&_.input]:input-lg [&_.input]:min-h-14"
        />

        {!selected ? (
          <div className="rounded-box border border-dashed border-base-300 bg-base-100 px-4 py-12 text-center">
            <Tag className="mx-auto size-10 text-base-content/25 mb-3" />
            <p className="text-base-content/60 text-sm">
              Escribe un código o nombre para ver menudeo, mayoreo y costo.
            </p>
          </div>
        ) : (
          <article className="rounded-box border border-base-200 bg-base-100 overflow-hidden">
            <div className="border-b border-base-200 px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-base-content/55">
                    Código {selected.codigo}
                  </p>
                  <h2 className="text-lg font-bold leading-snug">{selected.nombre}</h2>
                </div>
                <span className={`badge ${stockBadgeClass(selected.stock)}`}>
                  {selected.stock} en bodega
                </span>
              </div>
            </div>

            <div className="space-y-2 p-4 sm:p-5">
              <PriceRow
                label="Precio público (menudeo)"
                value={formatPrecio(publico)}
                highlight
              />
              <PriceRow
                label="Precio mayoreo"
                value={mayoreo != null ? formatPrecio(mayoreo) : "—"}
              />
              <PriceRow
                label="Costo de compra (sin IVA)"
                value={
                  selected.precio_compra != null
                    ? formatPrecio(selected.precio_compra)
                    : "—"
                }
              />
              {selected.margen_ganancia != null && (
                <p className="text-xs text-base-content/55 pt-1">
                  Margen configurado: {Number(selected.margen_ganancia)}%
                </p>
              )}
            </div>

            <div className="border-t border-base-200 px-4 py-3 sm:px-5 bg-base-200/20">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="btn btn-primary btn-sm w-full sm:w-auto gap-2 touch-manipulation min-h-11"
              >
                <Pencil className="size-4" />
                Editar precios
              </button>
            </div>
          </article>
        )}
      </div>

      <ProductoFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        producto={selected}
        returnTo="/precios"
      />
    </>
  )
}
