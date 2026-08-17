"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { FileText, Minus, Plus, Trash2 } from "lucide-react"
import ProductSearch from "@/components/inventario/ProductSearch"
import { formatPrecio, getPrecioVenta, SAT_FORMAS_PAGO } from "@/lib/productos"
import { calcularTotalesPreciosConIva } from "@/lib/precios"
import { crearCotizacion } from "@/app/(app)/cotizaciones/actions"

function unitPriceFromCartLine(line, isMayoreo) {
  return isMayoreo
    ? Number(line.precio_mayoreo ?? line.precio ?? 0)
    : Number(line.precio_publico ?? line.precio ?? 0)
}

function applyMayoreoToCart(cart, isMayoreo) {
  return cart.map((c) => ({
    ...c,
    precio: unitPriceFromCartLine(c, isMayoreo),
  }))
}

export default function CotizacionesForm({ clientes }) {
  const [cart, setCart] = useState([])
  const [formaPago, setFormaPago] = useState("01")
  const [clienteId, setClienteId] = useState("")
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState("")
  const [precioMayoreo, setPrecioMayoreo] = useState(false)
  const [notas, setNotas] = useState("")
  const [validezDias, setValidezDias] = useState(7)
  const [loading, setLoading] = useState(false)

  function handleClienteChange(id) {
    setClienteId(id)
    if (!id) {
      setPrecioMayoreo(false)
      setTelefonoWhatsapp("")
      setCart((prev) => applyMayoreoToCart(prev, false))
      return
    }
    const cliente = clientes.find((c) => c.id === id)
    const mayoreo = Boolean(cliente?.usa_precio_mayoreo)
    setPrecioMayoreo(mayoreo)
    if (cliente?.telefono) setTelefonoWhatsapp(cliente.telefono)
    setCart((prev) => applyMayoreoToCart(prev, mayoreo))
  }

  function handlePrecioMayoreoChange(checked) {
    setPrecioMayoreo(checked)
    setCart((prev) => applyMayoreoToCart(prev, checked))
  }

  function addToCart(producto) {
    const existing = cart.find((c) => c.producto_id === producto.id)
    if (existing) {
      setCart(
        cart.map((c) =>
          c.producto_id === producto.id
            ? { ...c, cantidad: c.cantidad + 1 }
            : c
        )
      )
    } else {
      setCart([
        ...cart,
        {
          producto_id: producto.id,
          codigo: producto.codigo,
          nombre: producto.nombre,
          stock: producto.stock,
          cantidad: 1,
          precio: getPrecioVenta(producto, precioMayoreo ? "mayoreo" : "publico"),
          precio_publico: Number(producto.precio_publico ?? producto.precio ?? 0),
          precio_mayoreo: Number(producto.precio_mayoreo ?? 0),
        },
      ])
    }
  }

  function updateQty(productoId, delta) {
    setCart(
      cart
        .map((c) => {
          if (c.producto_id !== productoId) return c
          const newQty = c.cantidad + delta
          if (newQty <= 0) return null
          return { ...c, cantidad: newQty }
        })
        .filter(Boolean)
    )
  }

  function removeItem(productoId) {
    setCart(cart.filter((c) => c.producto_id !== productoId))
  }

  const totals = useMemo(() => {
    const lines = cart.map((c) => ({
      cantidad: c.cantidad,
      precio_unitario: c.precio,
    }))
    return calcularTotalesPreciosConIva(lines)
  }, [cart])

  const tipoPrecioLabel = precioMayoreo ? "Mayoreo" : "Público (menudeo)"

  async function handleSubmit(e) {
    e.preventDefault()
    if (cart.length === 0) return
    setLoading(true)

    const formData = new FormData()
    formData.set(
      "items",
      JSON.stringify(
        cart.map((c) => ({
          producto_id: c.producto_id,
          cantidad: c.cantidad,
        }))
      )
    )
    formData.set("tipo_precio", precioMayoreo ? "mayoreo" : "publico")
    formData.set("forma_pago", formaPago)
    formData.set("validez_dias", String(validezDias))
    if (clienteId) formData.set("cliente_id", clienteId)
    if (telefonoWhatsapp) formData.set("telefono_whatsapp", telefonoWhatsapp)
    if (notas) formData.set("notas", notas)

    try {
      await crearCotizacion(formData)
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 pb-safe-nav-bar lg:pb-0 lg:grid-cols-2">
      <div className="space-y-4">
        <ProductSearch
          serverSearch
          onSelect={addToCart}
          placeholder="Buscar producto para cotizar…"
        />
        <p className="text-xs text-base-content/60">
          La cotización <strong>no descuenta existencias</strong> hasta que la
          apruebes y conviertas en venta.
        </p>
      </div>

      <div className="rounded-box border border-base-200 bg-base-100 p-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="size-5" />
          <h2 className="font-semibold">Cotización actual</h2>
          {cart.length > 0 && (
            <span className="badge badge-sm badge-outline ml-auto">
              {tipoPrecioLabel}
            </span>
          )}
        </div>

        {cart.length === 0 ? (
          <p className="text-sm text-base-content/60 py-6 text-center">
            Agrega productos desde el buscador
          </p>
        ) : (
          <ul className="divide-y divide-base-200 mb-4">
            {cart.map((item) => (
              <li key={item.producto_id} className="flex items-center gap-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{item.nombre}</p>
                  <p className="text-xs text-base-content/60">
                    {formatPrecio(item.precio)} × {item.cantidad}
                    {item.stock != null && (
                      <span className="ml-1">· hay {item.stock} en bodega</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateQty(item.producto_id, -1)}
                    className="btn btn-ghost btn-xs btn-square"
                    aria-label="Menos"
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="w-6 text-center text-sm tabular-nums">
                    {item.cantidad}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.producto_id, 1)}
                    className="btn btn-ghost btn-xs btn-square"
                    aria-label="Más"
                  >
                    <Plus className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.producto_id)}
                    className="btn btn-ghost btn-xs btn-square text-error"
                    aria-label="Quitar"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
                <span className="text-sm font-medium tabular-nums">
                  {formatPrecio(item.precio * item.cantidad)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-2 border-t border-base-200 pt-4 text-sm">
          <div className="flex justify-between">
            <span>Subtotal (sin IVA)</span>
            <span className="tabular-nums">{formatPrecio(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-base-content/70">
            <span>IVA incluido (16%)</span>
            <span className="tabular-nums">{formatPrecio(totals.iva)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="tabular-nums">{formatPrecio(totals.total)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3" id="cotizacion-form">
          <div className="rounded-lg border border-base-200 bg-base-200/30 p-3 space-y-3">
            <div className="form-control w-full">
              <label className="label py-0" htmlFor="cot-cliente">
                <span className="label-text font-medium">Cliente</span>
              </label>
              <select
                id="cot-cliente"
                value={clienteId}
                onChange={(e) => handleClienteChange(e.target.value)}
                className="select select-bordered select-sm w-full"
              >
                <option value="">Sin cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.razon_social ?? c.nombre}
                  </option>
                ))}
              </select>
            </div>

            {clienteId ? (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={precioMayoreo}
                  onChange={(e) => handlePrecioMayoreoChange(e.target.checked)}
                  className="checkbox checkbox-sm checkbox-primary mt-0.5"
                />
                <span className="text-sm">
                  <span className="font-medium">Precio mayoreo</span>
                </span>
              </label>
            ) : null}

            <div className="form-control w-full">
              <label className="label py-0" htmlFor="cot-whatsapp">
                <span className="label-text font-medium">WhatsApp del cliente</span>
              </label>
              <input
                id="cot-whatsapp"
                type="tel"
                value={telefonoWhatsapp}
                onChange={(e) => setTelefonoWhatsapp(e.target.value)}
                placeholder="52 1 55 1234 5678"
                className="input input-bordered input-sm w-full"
              />
              <p className="mt-1 text-xs text-base-content/55">
                Para enviar el presupuesto después de guardar.
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="form-control w-full">
              <label className="label py-0" htmlFor="cot-validez">
                <span className="label-text font-medium">Válida (días)</span>
              </label>
              <input
                id="cot-validez"
                type="number"
                min={1}
                max={90}
                value={validezDias}
                onChange={(e) => setValidezDias(Number(e.target.value) || 7)}
                className="input input-bordered input-sm w-full"
              />
            </div>
            <div className="form-control w-full">
              <label className="label py-0" htmlFor="cot-forma-pago">
                <span className="label-text font-medium">Forma de pago</span>
              </label>
              <select
                id="cot-forma-pago"
                value={formaPago}
                onChange={(e) => setFormaPago(e.target.value)}
                className="select select-bordered select-sm w-full"
              >
                {SAT_FORMAS_PAGO.map((f) => (
                  <option key={f.clave} value={f.clave}>
                    {f.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-control w-full">
            <label className="label py-0" htmlFor="cot-notas">
              <span className="label-text font-medium">Notas</span>
            </label>
            <textarea
              id="cot-notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Condiciones, entrega, etc."
              className="textarea textarea-bordered textarea-sm w-full"
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={cart.length === 0 || loading}
              className="btn btn-primary flex-1 touch-manipulation hidden lg:flex"
            >
              {loading ? "Guardando…" : "Guardar cotización"}
            </button>
            <Link href="/cotizaciones" className="btn btn-ghost btn-sm">
              Cancelar
            </Link>
          </div>
        </form>
      </div>

      {cart.length > 0 && (
        <div
          className="fixed inset-x-0 z-30 border-t border-base-200 bg-base-100/95 p-3 shadow-lg backdrop-blur-md lg:hidden"
          style={{
            bottom: "calc(var(--mobile-nav-height) + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-base-content/60">
                {cart.length} producto{cart.length === 1 ? "" : "s"}
              </p>
              <p className="text-lg font-bold tabular-nums">
                {formatPrecio(totals.total)}
              </p>
            </div>
            <button
              type="submit"
              form="cotizacion-form"
              disabled={loading}
              className="btn btn-primary min-h-11 touch-manipulation shrink-0"
            >
              {loading ? "…" : "Guardar"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
