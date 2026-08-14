"use client"

import { X } from "lucide-react"
import {
  createProducto,
  updateProducto,
} from "@/app/(app)/productos/actions"

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
  proveedores = [],
}) {
  const isEdit = Boolean(producto?.id)

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
              Completa los campos del catálogo. Los marcados con * son obligatorios.
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
                hint="Descripción que verás en ventas e inventario."
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
              <Field
                label="Proveedor"
                hint="Opcional. Quién te surte este artículo."
              >
                <select
                  name="proveedor_id"
                  className="select select-bordered w-full"
                  defaultValue={producto?.proveedor_id ?? ""}
                >
                  <option value="">Sin proveedor</option>
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
              Precios (MXN)
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field
                label="Precio de compra"
                hint="Lo que te cuesta al proveedor."
              >
                <input
                  name="precio_compra"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={producto?.precio_compra ?? ""}
                  className="input input-bordered w-full"
                  placeholder="0.00"
                />
              </Field>
              <Field
                label="Precio mayoreo"
                hint="Venta a clientes con precio de mayoreo."
              >
                <input
                  name="precio_mayoreo"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={producto?.precio_mayoreo ?? ""}
                  className="input input-bordered w-full"
                  placeholder="0.00"
                />
              </Field>
              <Field
                label="Precio público"
                hint="Precio en mostrador (venta normal)."
                required
              >
                <input
                  name="precio_publico"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  defaultValue={
                    producto?.precio_publico ?? producto?.precio ?? ""
                  }
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
            <div className="grid gap-3 sm:grid-cols-2">
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
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
              Facturación (SAT)
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Clave SAT del producto"
                hint="Catálogo SAT. Por defecto 01010101 (no identificado)."
              >
                <input
                  name="clave_sat"
                  type="text"
                  maxLength={8}
                  defaultValue={producto?.clave_sat ?? "01010101"}
                  className="input input-bordered w-full"
                  placeholder="01010101"
                />
              </Field>
              <Field
                label="Unidad SAT"
                hint="Por defecto H87 (pieza)."
              >
                <input
                  name="unidad_sat"
                  type="text"
                  maxLength={4}
                  defaultValue={producto?.unidad_sat ?? "H87"}
                  className="input input-bordered w-full"
                  placeholder="H87"
                />
              </Field>
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
