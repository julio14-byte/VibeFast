"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { calcularTotalesDesdePreciosConIva, desglosarPrecioConIva } from "@/lib/cfdi"
import { requireOrgContext } from "@/lib/organization/context"

async function requireUser() {
  return requireOrgContext("/ventas")
}

function fail(message) {
  redirect(`/ventas?error=${encodeURIComponent(message)}`)
}

async function getNextVentaFolio(supabase, organizationId) {
  const { data } = await supabase
    .from("ventas")
    .select("folio")
    .eq("organization_id", organizationId)
    .order("folio", { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data?.folio ?? 0) + 1
}

export async function registrarVenta(formData) {
  try {
    const itemsJson = formData.get("items")?.toString()
    const tipoPrecio = formData.get("tipo_precio")?.toString() || "publico"
    const formaPago = formData.get("forma_pago")?.toString() || "01"
    const metodoPago = formData.get("metodo_pago")?.toString() || "PUE"
    const notas = formData.get("notas")?.toString().trim() || null
    const clienteId = formData.get("cliente_id")?.toString() || null
    const imprimirTicket = formData.get("imprimir_ticket")?.toString() === "1"

    if (!itemsJson) fail("No hay productos en la venta.")

    let items
    try {
      items = JSON.parse(itemsJson)
    } catch {
      fail("Formato de venta inválido.")
    }

    if (!Array.isArray(items) || items.length === 0) {
      fail("Agrega al menos un producto.")
    }

    const { supabase, user, organizationId } = await requireUser()
    const folio = await getNextVentaFolio(supabase, organizationId)

    const lineas = []
    for (const item of items) {
      const cantidad = Number(item.cantidad)
      const productoId = item.producto_id

      if (!productoId || !Number.isInteger(cantidad) || cantidad <= 0) {
        fail("Cantidad inválida en un producto.")
      }

      const { data: producto, error: pErr } = await supabase
        .from("productos")
        .select("*")
        .eq("id", productoId)
        .eq("organization_id", organizationId)
        .single()

      if (pErr || !producto) fail("Producto no encontrado.")
      if (producto.stock < cantidad) {
        fail(`Stock insuficiente de "${producto.nombre}" (hay ${producto.stock}).`)
      }

      const precioConIva =
        tipoPrecio === "mayoreo"
          ? Number(producto.precio_mayoreo ?? producto.precio)
          : Number(producto.precio_publico ?? producto.precio)

      const subtotalLinea = round2(precioConIva * cantidad)
      const { base: precioUnitarioBase } = desglosarPrecioConIva(precioConIva)

      lineas.push({
        producto_id: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        cantidad,
        precio_unitario: precioConIva,
        subtotal: subtotalLinea,
        precio_unitario_base: precioUnitarioBase,
      })

      const { error: stockErr } = await supabase
        .from("productos")
        .update({ stock: producto.stock - cantidad })
        .eq("id", producto.id)
        .eq("organization_id", organizationId)

      if (stockErr) fail(stockErr.message)
    }

    const { subtotal, iva, total } = calcularTotalesDesdePreciosConIva(lineas)

    const { data: venta, error: ventaErr } = await supabase
      .from("ventas")
      .insert({
        user_id: user.id,
        organization_id: organizationId,
        cliente_id: clienteId,
        folio,
        tipo_precio: tipoPrecio,
        subtotal,
        iva,
        total,
        forma_pago: formaPago,
        metodo_pago: metodoPago,
        notas,
      })
      .select("id")
      .single()

    if (ventaErr) fail(ventaErr.message)

    const ventaItems = lineas.map((l) => ({
      venta_id: venta.id,
      producto_id: l.producto_id,
      codigo: l.codigo,
      nombre: l.nombre,
      cantidad: l.cantidad,
      precio_unitario: l.precio_unitario,
      subtotal: l.subtotal,
    }))

    const { error: itemsErr } = await supabase.from("venta_items").insert(ventaItems)
    if (itemsErr) fail(itemsErr.message)

    revalidatePath("/ventas")
    revalidatePath("/inventario")
    revalidatePath("/productos")

    if (imprimirTicket) {
      redirect(`/ventas/ticket/${venta.id}?print=1`)
    }

    redirect(`/ventas?ok=venta&folio=${folio}&total=${total}&venta_id=${venta.id}`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message || "Error al registrar la venta.")
  }
}

export async function marcarTicketImpreso(ventaId) {
  const { supabase, organizationId } = await requireUser()

  await supabase
    .from("ventas")
    .update({
      ticket_impreso: true,
      ticket_impreso_at: new Date().toISOString(),
    })
    .eq("id", ventaId)
    .eq("organization_id", organizationId)

  revalidatePath("/ventas")
}

function round2(n) {
  return Math.round(n * 100) / 100
}
