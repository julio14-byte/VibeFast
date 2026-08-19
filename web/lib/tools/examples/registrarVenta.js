import { normalizeCodigo } from "@/lib/productos/codigo"
import { calcularTotalesDesdePreciosConIva } from "@/lib/cfdi"
import { getPrecioVenta } from "@/lib/productos"
import { requireToolOrgContext } from "@/lib/tools/orgContext"

// Registra una venta desde el chat: busca productos, descuenta stock.
export const registrarVenta = {
  name: "registrar_venta",
  description:
    "Registra una venta en el mostrador. Indica código del producto y cantidad. Descuenta stock automáticamente.",
  parameters: {
    type: "object",
    properties: {
      codigo: {
        type: "string",
        description: "Código alfanumérico del producto a vender.",
      },
      cantidad: {
        type: "number",
        description: "Cantidad a vender.",
      },
      tipo_precio: {
        type: "string",
        enum: ["publico", "mayoreo"],
        description: "Tipo de precio: publico o mayoreo.",
      },
      forma_pago: {
        type: "string",
        description: "Forma de pago SAT (01=efectivo, 03=transferencia, 04=crédito).",
      },
    },
    required: ["codigo", "cantidad"],
    additionalProperties: false,
  },
  async execute({ codigo, cantidad, tipo_precio = "publico", forma_pago = "01" }) {
    const { supabase, user, organizationId } = await requireToolOrgContext()

    const codigoNorm = normalizeCodigo(String(codigo ?? ""))
    const cantidadNum = Number(cantidad)
    if (!codigoNorm) {
      throw new Error("Código inválido.")
    }
    if (!Number.isInteger(cantidadNum) || cantidadNum <= 0) {
      throw new Error("Cantidad inválida.")
    }

    const { data: producto, error: pErr } = await supabase
      .from("productos")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("codigo", codigoNorm)
      .maybeSingle()

    if (pErr) throw new Error(pErr.message)
    if (!producto) {
      return { ok: false, error: `No hay producto con código ${codigoNorm}.` }
    }
    if (producto.stock > 0 && producto.stock < cantidadNum) {
      return {
        ok: false,
        error: `Stock insuficiente de "${producto.nombre}" (hay ${producto.stock}).`,
      }
    }

    const precioUnitario = getPrecioVenta(producto, tipo_precio)
    const lineTotal = round2(precioUnitario * cantidadNum)
    const { subtotal, iva, total } = calcularTotalesDesdePreciosConIva([
      { cantidad: cantidadNum, precio_unitario: precioUnitario },
    ])

    const { data: lastVenta } = await supabase
      .from("ventas")
      .select("folio")
      .eq("organization_id", organizationId)
      .order("folio", { ascending: false })
      .limit(1)
      .maybeSingle()

    const folio = (lastVenta?.folio ?? 0) + 1

    const { data: venta, error: vErr } = await supabase
      .from("ventas")
      .insert({
        user_id: user.id,
        organization_id: organizationId,
        folio,
        tipo_precio: tipo_precio,
        subtotal,
        iva,
        total,
        forma_pago: forma_pago || "01",
        metodo_pago: "PUE",
      })
      .select("id, folio, total")
      .single()

    if (vErr) throw new Error(vErr.message)

    const { error: itemErr } = await supabase.from("venta_items").insert({
      venta_id: venta.id,
      producto_id: producto.id,
      codigo: producto.codigo,
      nombre: producto.nombre,
      cantidad: cantidadNum,
      precio_unitario: precioUnitario,
      subtotal: lineTotal,
    })

    if (itemErr) throw new Error(itemErr.message)

    const { error: stockErr } = await supabase
      .from("productos")
      .update({ stock: producto.stock - cantidadNum })
      .eq("id", producto.id)

    if (stockErr) throw new Error(stockErr.message)

    return {
      ok: true,
      mensaje: `Venta #${venta.folio} registrada: ${cantidadNum}× "${producto.nombre}" por $${total.toFixed(2)}.`,
      venta: {
        folio: venta.folio,
        producto: producto.nombre,
        cantidad: cantidadNum,
        precio_unitario: precioUnitario,
        total,
        stock_restante: producto.stock - cantidadNum,
      },
    }
  },
}

function round2(n) {
  return Math.round(n * 100) / 100
}
