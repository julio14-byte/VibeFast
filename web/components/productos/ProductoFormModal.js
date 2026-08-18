"use client"

import { useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
import {
  createProducto,
  updateProducto,
} from "@/app/(app)/productos/actions"
import { formatMargenPct, margenesParaMostrar } from "@/lib/productos/margenes"
import SatCatalogSearch from "./SatCatalogSearch"

function Field({ label, hint, required, children }) {
  return (
    <div className="form-control w-full">
      <label className="label py-1">
        <span className="label-text font-medium">
          {label}
          {required ? <span className="text-error"> *</span> : null}
        </span>
      </label>
      {children}
      {hint ? (
        <p className="mt-1 text-xs text-base-content/55">{hint}</p>
      ) : null}
    </div>
  )
}

export default function ProductoFormModal({
  open,
  onClose,
  producto,
  returnTo,
}) {
  const isEdit = Boolean(producto?.id)

  const [claveSat, setClaveSat] = useState(producto?.clave_sat ?? "01010101")
  const [unidadSat, setUnidadSat] = useState(producto?.unidad_sat ?? "H87")
  const [precioCompra, setPrecioCompra] = useState("")
  const [precioPublico, setPrecioPublico] = useState("")
  const [precioMayoreo, setPrecioMayoreo] = useState("")

  useEffect(() => {
    if (!open) return
    setClaveSat(producto?.clave_sat ?? "01010101")
    setUnidadSat(producto?.unidad_sat ?? "H87")
    setPrecioCompra(
      producto?.precio_compra != null ? String(producto.precio_compra) : ""
    )
    setPrecioPublico(
      producto?.precio_publico != null || producto?.precio != null
        ? String(producto?.precio_publico ?? producto?.precio)
        : ""
    )
    setPrecioMayoreo(
      producto?.precio_mayoreo != null ? String(producto.precio_mayoreo) : ""
    )
  }, [open, producto])

  const compraNum = Number.parseFloat(precioCompra) || 0
  const publicoNum = Number.parseFloat(precioPublico) || 0
  const mayoreoNum = Number.parseFloat(precioMayoreo) || 0

  const { margenPublico, margenMayoreo } = useMemo(
    () =>
      margenesParaMostrar({
        precio_compra: compraNum,
        precio_publico: publicoNum,
        precio_mayoreo: mayoreoNum,
      }),
    [compraNum, publicoNum, mayoreoNum]
  )

  if (!open) return null

  return (
    <div className="modal modal-open" role="dialog" aria-modal="true">
      <div className="modal-box max-h-[90vh] max-w-2xl overflow-y-auto p-0">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-base-200 bg-base-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold">
              {isEdit ? "Editar producto" : "Nuevo producto"}
            </h2>
            <p className="text-sm text-base-content/60">
              Define costo y precios con IVA; el margen se calcula automático.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-square touch-manipulation"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>

        <form
          action={isEdit ? updateProducto : createProducto}
          className="space-y-6 px-5 py-4"
        >
          {isEdit && <input type="hidden" name="id" value={producto.id} />}
          {returnTo ? (
            <input type="hidden" name="return_to" value={returnTo} />
          ) : null}

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
              Identificación
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Código del producto"
                hint="SKU único en tu catálogo (ej. BDLI018 o 1001)."
                required
              >
                <input
                  name="codigo"
                  type="text"
                  required
                  maxLength={64}
                  pattern="[A-Za-z0-9._-]+"
                  defaultValue={producto?.codigo ?? ""}
                  className="input input-bordered w-full"
                  placeholder="Ej. BDLI018"
                />
              </Field>
              <Field
                label="Nombre del producto"
                hint="Descripción en ventas, inventario y factura."
                required
              >
                <input
                  name="nombre"
                  required
                  maxLength={120}
                  defaultValue={producto?.nombre ?? ""}
                  className="input input-bordered w-full"
                  placeholder="Ej. Tubo PVC 1/2"
                />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
              Costo y precios de venta
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field
                label="Precio de compra (sin IVA)"
                hint="Costo neto del proveedor."
              >
                <input
                  name="precio_compra"
                  type="number"
                  min="0"
                  step="0.01"
                  value={precioCompra}
                  onChange={(e) => setPrecioCompra(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="0.00"
                />
              </Field>
              <Field
                label="Precio público / menudeo"
                hint="Precio al público con IVA incluido."
                required
              >
                <input
                  name="precio_publico"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={precioPublico}
                  onChange={(e) => setPrecioPublico(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="0.00"
                />
              </Field>
              <Field
                label="Precio mayoreo"
                hint="Precio mayoreo con IVA incluido."
              >
                <input
                  name="precio_mayoreo"
                  type="number"
                  min="0"
                  step="0.01"
                  value={precioMayoreo}
                  onChange={(e) => setPrecioMayoreo(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="0.00"
                />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
              Márgenes calculados
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-base-200 bg-base-200/30 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-base-content/55">
                  Margen mayoreo
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-primary">
                  {formatMargenPct(margenMayoreo)}
                </p>
                <p className="mt-1 text-xs text-base-content/55">
                  Sobre costo sin IVA, según precio mayoreo.
                </p>
              </div>
              <div className="rounded-xl border border-base-200 bg-base-200/30 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-base-content/55">
                  Margen menudeo
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-primary">
                  {formatMargenPct(margenPublico)}
                </p>
                <p className="mt-1 text-xs text-base-content/55">
                  Sobre costo sin IVA, según precio público.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
              Inventario
            </h3>
            <Field
              label="Stock (unidades)"
              hint="Cantidad disponible en anaquel."
              required
            >
              <input
                name="stock"
                type="number"
                required
                min="0"
                step="1"
                defaultValue={producto?.stock ?? ""}
                className="input input-bordered w-full"
                placeholder="0"
              />
            </Field>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
              Facturación (catálogo SAT)
            </h3>
            <div className="grid gap-3 sm:grid-cols-1">
              <SatCatalogSearch
                type="clave-prodserv"
                value={claveSat}
                onChange={(clave) => setClaveSat(clave || "01010101")}
                label="Clave producto / servicio (SAT)"
                hint="Busca en el catálogo oficial del SAT por código o descripción."
              />
              <SatCatalogSearch
                type="unidad"
                value={unidadSat}
                onChange={(clave) => setUnidadSat(clave || "H87")}
                label="Unidad de medida (SAT)"
                hint="Ej. H87 = pieza, MTR = metro, KGM = kilogramo."
              />
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-2 border-t border-base-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost touch-manipulation"
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary touch-manipulation">
              {isEdit ? "Guardar cambios" : "Agregar producto"}
            </button>
          </div>
        </form>
      </div>
      <button
        type="button"
        className="modal-backdrop"
        aria-label="Cerrar"
        onClick={onClose}
      />
    </div>
  )
}
