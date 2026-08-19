"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"
import ProductSearch from "@/components/inventario/ProductSearch"
import { formatPrecio, getPrecioVenta, SAT_FORMAS_PAGO } from "@/lib/productos"
import { calcularTotalesPreciosConIva } from "@/lib/precios"
import { registrarVenta } from "@/app/(app)/ventas/actions"

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

export default function VentasPOS({ clientes }) {
  const [cart, setCart] = useState([])
  const [formaPago, setFormaPago] = useState("01")
  const [clienteId, setClienteId] = useState("")
  const [precioMayoreo, setPrecioMayoreo] = useState(false)
  const [notas, setNotas] = useState("")
  const [imprimirTicket, setImprimirTicket] = useState(true)
  const [loading, setLoading] = useState(false)

  function handleClienteChange(id) {
    setClienteId(id)
    if (!id) {
      setPrecioMayoreo(false)
      setCart((prev) => applyMayoreoToCart(prev, false))
      return
    }
    const cliente = clientes.find((c) => c.id === id)
    const mayoreo = Boolean(cliente?.usa_precio_mayoreo)
    setPrecioMayoreo(mayoreo)
    setCart((prev) => applyMayoreoToCart(prev, mayoreo))
  }

  function handlePrecioMayoreoChange(checked) {
    setPrecioMayoreo(checked)
    setCart((prev) => applyMayoreoToCart(prev, checked))
  }

  function addToCart(producto) {
    if (!producto?.id) return

    const stock = Number(producto.stock) || 0
    const tracksStock = stock > 0
    const isMayoreo = precioMayoreo

    setCart((prev) => {
      const existing = prev.find((c) => c.producto_id === producto.id)
      if (existing) {
        if (tracksStock && existing.cantidad >= stock) return prev
        return prev.map((c) =>
          c.producto_id === producto.id
            ? { ...c, cantidad: c.cantidad + 1 }
            : c
        )
      }

      return [
        ...prev,
        {
          producto_id: producto.id,
          codigo: producto.codigo,
          nombre: producto.nombre,
          stock,
          cantidad: 1,
          precio: getPrecioVenta(producto, isMayoreo ? "mayoreo" : "publico"),
          precio_publico: Number(
            producto.precio_publico ?? producto.precio ?? 0
          ),
          precio_mayoreo: Number(producto.precio_mayoreo ?? 0),
        },
      ]
    })
  }

  function updateQty(productoId, delta) {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.producto_id !== productoId) return c
          const newQty = c.cantidad + delta
          if (newQty <= 0) return null
          const stock = Number(c.stock) || 0
          if (stock > 0 && newQty > stock) return c
          return { ...c, cantidad: newQty }
        })
        .filter(Boolean)
    )
  }

  function removeItem(productoId) {
    setCart((prev) => prev.filter((c) => c.producto_id !== productoId))
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
    formData.set("metodo_pago", "PUE")
    if (clienteId) formData.set("cliente_id", clienteId)
    if (notas) formData.set("notas", notas)
    if (imprimirTicket) formData.set("imprimir_ticket", "1")

    try {
      await registrarVenta(formData)
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
          placeholder="Buscar por código o nombre…"
        />

        <p className="text-xs text-base-content/60">
          También puedes registrar ventas desde el{" "}
          <Link href="/chat" className="link link-primary">chat</Link>:
          &quot;Vende 3 llaves código 2053&quot;
        </p>
      </div>

      <div className="rounded-box border border-base-200 bg-base-100 p-4">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="size-5" />
          <h2 className="font-semibold">Venta actual</h2>
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
              <li key={item.producto_id} className="flex items-start gap-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm leading-snug break-words whitespace-normal">
                    {item.nombre}
                  </p>
                  <p className="text-xs text-base-content/60">
                    {formatPrecio(item.precio)} × {item.cantidad}
                    {Number(item.stock) === 0 ? (
                      <span className="text-warning"> · sin stock registrado</span>
                    ) : null}
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-3" id="venta-form">
          <div className="rounded-lg border border-base-200 bg-base-200/30 p-3 space-y-3">
            <div className="form-control w-full">
              <label className="label py-0" htmlFor="venta-cliente">
                <span className="label-text font-medium">Cliente</span>
              </label>
              <select
                id="venta-cliente"
                value={clienteId}
                onChange={(e) => handleClienteChange(e.target.value)}
                className="select select-bordered select-sm w-full"
              >
                <option value="">Sin cliente (público general)</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.razon_social ?? c.nombre}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-base-content/55">
                Selecciona un cliente para elegir precio mayoreo o menudeo.
              </p>
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
                  <span className="block text-xs text-base-content/60 mt-0.5">
                    Marcado: precio mayoreo del catálogo. Desmarcado: precio
                    público (menudeo).
                  </span>
                </span>
              </label>
            ) : (
              <p className="text-xs text-base-content/55">
                Sin cliente se usa siempre{" "}
                <strong>precio público (menudeo)</strong>.
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={imprimirTicket}
              onChange={(e) => setImprimirTicket(e.target.checked)}
              className="checkbox checkbox-sm checkbox-primary"
            />
            Imprimir ticket (TM-T20II · 80 mm) al cobrar
          </label>

          <div className="form-control w-full">
            <label className="label py-0" htmlFor="venta-forma-pago">
              <span className="label-text font-medium">Forma de pago</span>
            </label>
            <select
              id="venta-forma-pago"
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

          <div className="form-control w-full">
            <label className="label py-0" htmlFor="venta-notas">
              <span className="label-text font-medium">Notas</span>
            </label>
            <textarea
              id="venta-notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Opcional"
              className="textarea textarea-bordered textarea-sm w-full"
              rows={2}
            />
          </div>

          <button
            type="submit"
            disabled={cart.length === 0 || loading}
            className="btn btn-primary w-full touch-manipulation hidden lg:flex"
          >
            {loading ? "Registrando…" : "Cobrar venta"}
          </button>
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
                {cart.length} producto{cart.length === 1 ? "" : "s"} ·{" "}
                {tipoPrecioLabel}
              </p>
              <p className="text-lg font-bold tabular-nums">
                {formatPrecio(totals.total)}
              </p>
            </div>
            <button
              type="submit"
              form="venta-form"
              disabled={loading}
              className="btn btn-primary min-h-11 touch-manipulation shrink-0"
            >
              {loading ? "…" : "Cobrar"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
