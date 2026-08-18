"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import {
  createProducto,
  updateProducto,
} from "@/app/(app)/productos/actions"
import { margenDesdePrecioVenta, precioVentaConIva } from "@/lib/precios"
import { margenesParaMostrar } from "@/lib/productos/margenes"
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

const DEFAULT_MARGEN = 30

function initialMargenMayoreo(producto, margenMenudeo) {
  if (producto?.margen_mayoreo != null) {
    return String(producto.margen_mayoreo)
  }
  const { margenMayoreo } = margenesParaMostrar(producto ?? {})
  if (margenMayoreo != null) return String(margenMayoreo)
  const base = Number(margenMenudeo ?? DEFAULT_MARGEN)
  return String(Math.round(base * 0.85 * 10) / 10)
}

function initialMargenMenudeo(producto) {
  if (producto?.margen_ganancia != null) {
    return String(producto.margen_ganancia)
  }
  const { margenPublico } = margenesParaMostrar(producto ?? {})
  return margenPublico != null ? String(margenPublico) : String(DEFAULT_MARGEN)
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
  const [margenMayoreo, setMargenMayoreo] = useState("")
  const [margenPublico, setMargenPublico] = useState("")
  const [precioPublico, setPrecioPublico] = useState("")
  const [precioMayoreo, setPrecioMayoreo] = useState("")
  const [publicoManual, setPublicoManual] = useState(false)
  const [mayoreoManual, setMayoreoManual] = useState(false)

  useEffect(() => {
    if (!open) return
    const margenMen = initialMargenMenudeo(producto)
    setClaveSat(producto?.clave_sat ?? "01010101")
    setUnidadSat(producto?.unidad_sat ?? "H87")
    setPrecioCompra(
      producto?.precio_compra != null ? String(producto.precio_compra) : ""
    )
    setMargenPublico(margenMen)
    setMargenMayoreo(initialMargenMayoreo(producto, margenMen))
    setPrecioPublico(
      producto?.precio_publico != null || producto?.precio != null
        ? String(producto?.precio_publico ?? producto?.precio)
        : ""
    )
    setPrecioMayoreo(
      producto?.precio_mayoreo != null ? String(producto.precio_mayoreo) : ""
    )
    setPublicoManual(Boolean(producto?.id))
    setMayoreoManual(Boolean(producto?.id))
  }, [open, producto])

  const compraNum = Number.parseFloat(precioCompra) || 0
  const margenPublicoNum = Number.parseFloat(margenPublico) || 0
  const margenMayoreoNum = Number.parseFloat(margenMayoreo) || 0
  const publicoNum = Number.parseFloat(precioPublico) || 0
  const mayoreoNum = Number.parseFloat(precioMayoreo) || 0

  useEffect(() => {
    if (!compraNum || publicoManual) return
    setPrecioPublico(String(precioVentaConIva(compraNum, margenPublicoNum)))
  }, [compraNum, margenPublicoNum, publicoManual])

  useEffect(() => {
    if (!compraNum || mayoreoManual) return
    setPrecioMayoreo(String(precioVentaConIva(compraNum, margenMayoreoNum)))
  }, [compraNum, margenMayoreoNum, mayoreoManual])

  useEffect(() => {
    if (!compraNum || !publicoManual || !publicoNum) return
    const m = margenDesdePrecioVenta(compraNum, publicoNum)
    if (m != null) setMargenPublico(String(m))
  }, [compraNum, publicoNum, publicoManual])

  useEffect(() => {
    if (!compraNum || !mayoreoManual || !mayoreoNum) return
    const m = margenDesdePrecioVenta(compraNum, mayoreoNum)
    if (m != null) setMargenMayoreo(String(m))
  }, [compraNum, mayoreoNum, mayoreoManual])

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
              Ajusta costo, márgenes o precios con IVA; se sincronizan solos.
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
              Costo, márgenes y precios
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                  onChange={(e) => {
                    setPrecioCompra(e.target.value)
                    setPublicoManual(false)
                    setMayoreoManual(false)
                  }}
                  className="input input-bordered w-full"
                  placeholder="0.00"
                />
              </Field>
              <Field
                label="Margen mayoreo (%)"
                hint="Recalcula precio mayoreo al cambiar costo o margen."
              >
                <input
                  name="margen_mayoreo"
                  type="number"
                  min="-100"
                  max="99999999"
                  step="0.1"
                  value={margenMayoreo}
                  onChange={(e) => {
                    setMargenMayoreo(e.target.value)
                    setMayoreoManual(false)
                  }}
                  className="input input-bordered w-full"
                  placeholder="25"
                />
              </Field>
              <Field
                label="Margen menudeo (%)"
                hint="Recalcula precio público al cambiar costo o margen."
              >
                <input
                  name="margen_ganancia"
                  type="number"
                  min="-100"
                  max="99999999"
                  step="0.1"
                  value={margenPublico}
                  onChange={(e) => {
                    setMargenPublico(e.target.value)
                    setPublicoManual(false)
                  }}
                  className="input input-bordered w-full"
                  placeholder="30"
                />
              </Field>
              <Field
                label="Precio mayoreo"
                hint="Con IVA incluido. Editar aquí actualiza el margen."
              >
                <input
                  name="precio_mayoreo"
                  type="number"
                  min="0"
                  step="0.01"
                  value={precioMayoreo}
                  onChange={(e) => {
                    setMayoreoManual(true)
                    setPrecioMayoreo(e.target.value)
                  }}
                  className="input input-bordered w-full"
                  placeholder="0.00"
                />
              </Field>
              <Field
                label="Precio público / menudeo"
                hint="Con IVA incluido. Editar aquí actualiza el margen."
                required
              >
                <input
                  name="precio_publico"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={precioPublico}
                  onChange={(e) => {
                    setPublicoManual(true)
                    setPrecioPublico(e.target.value)
                  }}
                  className="input input-bordered w-full"
                  placeholder="0.00"
                />
              </Field>
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
