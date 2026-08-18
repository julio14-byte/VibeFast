"use client"

import { useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
import {
  createProducto,
  updateProducto,
} from "@/app/(app)/productos/actions"
import { IVA_RATE, precioVentaConIva, round2 } from "@/lib/precios"
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

export default function ProductoFormModal({
  open,
  onClose,
  producto,
  returnTo,
}) {
  const isEdit = Boolean(producto?.id)

  const initialCompra = producto?.precio_compra ?? ""
  const initialMargen = producto?.margen_ganancia ?? DEFAULT_MARGEN
  const initialPublico =
    producto?.precio_publico ?? producto?.precio ?? ""
  const initialMayoreo = producto?.precio_mayoreo ?? ""

  const [claveSat, setClaveSat] = useState(producto?.clave_sat ?? "01010101")
  const [unidadSat, setUnidadSat] = useState(producto?.unidad_sat ?? "H87")
  const [precioCompra, setPrecioCompra] = useState(
    initialCompra === "" ? "" : String(initialCompra)
  )
  const [margen, setMargen] = useState(String(initialMargen))
  const [precioPublico, setPrecioPublico] = useState(
    initialPublico === "" ? "" : String(initialPublico)
  )
  const [precioMayoreo, setPrecioMayoreo] = useState(
    initialMayoreo === "" ? "" : String(initialMayoreo)
  )
  const [publicoManual, setPublicoManual] = useState(false)
  const [mayoreoManual, setMayoreoManual] = useState(false)

  useEffect(() => {
    if (!open) return
    setClaveSat(producto?.clave_sat ?? "01010101")
    setUnidadSat(producto?.unidad_sat ?? "H87")
    setPrecioCompra(
      producto?.precio_compra != null ? String(producto.precio_compra) : ""
    )
    setMargen(String(producto?.margen_ganancia ?? DEFAULT_MARGEN))
    setPrecioPublico(
      producto?.precio_publico != null || producto?.precio != null
        ? String(producto?.precio_publico ?? producto?.precio)
        : ""
    )
    setPrecioMayoreo(
      producto?.precio_mayoreo != null ? String(producto.precio_mayoreo) : ""
    )
    setPublicoManual(false)
    setMayoreoManual(false)
  }, [open, producto])

  const compraNum = Number.parseFloat(precioCompra) || 0
  const margenNum = Number.parseFloat(margen) || 0

  const previewSinIva = useMemo(() => {
    if (!compraNum) return 0
    return round2(compraNum * (1 + margenNum / 100))
  }, [compraNum, margenNum])

  useEffect(() => {
    if (!compraNum || publicoManual) return
    const conIva = precioVentaConIva(compraNum, margenNum)
    setPrecioPublico(String(conIva))
  }, [compraNum, margenNum, publicoManual])

  useEffect(() => {
    if (!compraNum || mayoreoManual) return
    const conIva = precioVentaConIva(compraNum, margenNum * 0.85)
    setPrecioMayoreo(String(conIva))
  }, [compraNum, margenNum, mayoreoManual])

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
              Compra sin IVA · venta con IVA incluido ({Math.round(IVA_RATE * 100)}%).
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
                hint="Número único en tu catálogo (ej. 1001)."
                required
              >
                <input
                  name="codigo"
                  type="number"
                  required
                  min="0"
                  step="1"
                  defaultValue={producto?.codigo ?? ""}
                  className="input input-bordered w-full"
                  placeholder="Ej. 1001"
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
              Costo y margen
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Precio de compra (sin IVA)"
                hint="Costo neto del proveedor, antes de IVA."
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
                label="Margen de ganancia (%)"
                hint="Sobre compra sin IVA. Ajusta manualmente; recalcula precios de venta."
              >
                <input
                  name="margen_ganancia"
                  type="number"
                  min="0"
                  max="1000"
                  step="0.1"
                  value={margen}
                  onChange={(e) => setMargen(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="30"
                />
              </Field>
            </div>
            {compraNum > 0 && (
              <p className="text-xs text-base-content/55 rounded-lg bg-base-200/50 px-3 py-2">
                Base sin IVA con margen {margenNum}%:{" "}
                <strong>${previewSinIva.toFixed(2)}</strong> → con IVA:{" "}
                <strong>${precioVentaConIva(compraNum, margenNum).toFixed(2)}</strong>
              </p>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
              Precios de venta (con IVA incluido)
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Precio público / menudeo (con IVA)"
                hint="Precio en mostrador. Editable; se calcula desde compra + margen."
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
              <Field
                label="Precio mayoreo (con IVA)"
                hint="Para clientes de mayoreo. Editable; por defecto ~85% del margen público."
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
