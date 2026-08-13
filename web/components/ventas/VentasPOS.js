"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"
import ProductSearch from "@/components/inventario/ProductSearch"
import { formatPrecio, getPrecioVenta, SAT_FORMAS_PAGO } from "@/lib/productos"
import { registrarVenta } from "@/app/(app)/ventas/actions"

export default function VentasPOS({ productos, clientes }) {
  const [cart, setCart] = useState([])
  const [tipoPrecio, setTipoPrecio] = useState("publico")
  const [formaPago, setFormaPago] = useState("01")
  const [clienteId, setClienteId] = useState("")
  const [notas, setNotas] = useState("")
  const [imprimirTicket, setImprimirTicket] = useState(true)
  const [loading, setLoading] = useState(false)

  function addToCart(producto) {
    const existing = cart.find((c) => c.producto_id === producto.id)
    if (existing) {
      if (existing.cantidad >= producto.stock) return
      setCart(
        cart.map((c) =>
          c.producto_id === producto.id
            ? { ...c, cantidad: c.cantidad + 1 }
            : c
        )
      )
    } else {
      if (producto.stock <= 0) return
      setCart([
        ...cart,
        {
          producto_id: producto.id,
          codigo: producto.codigo,
          nombre: producto.nombre,
          stock: producto.stock,
          cantidad: 1,
          precio: getPrecioVenta(producto, tipoPrecio),
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
          if (newQty > c.stock) return c
          return { ...c, cantidad: newQty }
        })
        .filter(Boolean)
    )
  }

  function removeItem(productoId) {
    setCart(cart.filter((c) => c.producto_id !== productoId))
  }

  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, c) => s + c.precio * c.cantidad, 0)
    const iva = subtotal * 0.16
    return { subtotal, iva, total: subtotal + iva }
  }, [cart])

  // Recalcular precios si cambia tipo
  function handleTipoPrecioChange(tipo) {
    setTipoPrecio(tipo)
    setCart(
      cart.map((c) => {
        const p = productos.find((pr) => pr.id === c.producto_id)
        return p ? { ...c, precio: getPrecioVenta(p, tipo) } : c
      })
    )
  }

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
    formData.set("tipo_precio", tipoPrecio)
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
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <ProductSearch
          productos={productos}
          onSelect={addToCart}
          placeholder="Buscar producto para vender…"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`btn btn-sm ${tipoPrecio === "publico" ? "btn-primary" : "btn-outline"}`}
            onClick={() => handleTipoPrecioChange("publico")}
          >
            Precio público
          </button>
          <button
            type="button"
            className={`btn btn-sm ${tipoPrecio === "mayoreo" ? "btn-primary" : "btn-outline"}`}
            onClick={() => handleTipoPrecioChange("mayoreo")}
          >
            Precio mayoreo
          </button>
        </div>

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
            <span>Subtotal</span>
            <span className="tabular-nums">{formatPrecio(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-base-content/70">
            <span>IVA (16%)</span>
            <span className="tabular-nums">{formatPrecio(totals.iva)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="tabular-nums">{formatPrecio(totals.total)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="select select-bordered select-sm w-full"
            aria-label="Cliente"
          >
            <option value="">Sin cliente (público general)</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.razon_social ?? c.nombre}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={imprimirTicket}
              onChange={(e) => setImprimirTicket(e.target.checked)}
              className="checkbox checkbox-sm checkbox-primary"
            />
            Imprimir ticket (80mm) al cobrar
          </label>

          <select
            value={formaPago}
            onChange={(e) => setFormaPago(e.target.value)}
            className="select select-bordered select-sm w-full"
            aria-label="Forma de pago"
          >
            {SAT_FORMAS_PAGO.map((f) => (
              <option key={f.clave} value={f.clave}>
                {f.nombre}
              </option>
            ))}
          </select>

          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Notas (opcional)"
            className="textarea textarea-bordered textarea-sm w-full"
            rows={2}
          />

          <button
            type="submit"
            disabled={cart.length === 0 || loading}
            className="btn btn-primary w-full"
          >
            {loading ? "Registrando…" : "Cobrar venta"}
          </button>
        </form>
      </div>
    </div>
  )
}
