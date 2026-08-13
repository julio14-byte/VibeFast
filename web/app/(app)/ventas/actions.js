"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { calcularTotales, generarCfdiXml } from "@/lib/cfdi"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/ventas&error=auth")
  return { supabase, user }
}

function fail(message, path = "/ventas") {
  redirect(`${path}?error=${encodeURIComponent(message)}`)
}

async function getNextVentaFolio(supabase, userId) {
  const { data } = await supabase
    .from("ventas")
    .select("folio")
    .eq("user_id", userId)
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

    const { supabase, user } = await requireUser()
    const folio = await getNextVentaFolio(supabase, user.id)

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
        .eq("user_id", user.id)
        .single()

      if (pErr || !producto) fail("Producto no encontrado.")
      if (producto.stock < cantidad) {
        fail(`Stock insuficiente de "${producto.nombre}" (hay ${producto.stock}).`)
      }

      const precioUnitario =
        tipoPrecio === "mayoreo"
          ? Number(producto.precio_mayoreo ?? producto.precio)
          : Number(producto.precio_publico ?? producto.precio)

      const subtotal = round2(precioUnitario * cantidad)

      lineas.push({
        producto_id: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        cantidad,
        precio_unitario: precioUnitario,
        subtotal,
        clave_sat: producto.clave_sat ?? "01010101",
        unidad_sat: producto.unidad_sat ?? "H87",
      })

      const { error: stockErr } = await supabase
        .from("productos")
        .update({ stock: producto.stock - cantidad })
        .eq("id", producto.id)
        .eq("user_id", user.id)

      if (stockErr) fail(stockErr.message)
    }

    const { subtotal, iva, total } = calcularTotales(lineas)

    const { data: venta, error: ventaErr } = await supabase
      .from("ventas")
      .insert({
        user_id: user.id,
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
    revalidatePath("/dashboard")
    redirect(`/ventas?ok=venta&folio=${folio}&total=${total}`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message || "Error al registrar la venta.")
  }
}

export async function guardarEmpresaFiscal(formData) {
  try {
    const { supabase, user } = await requireUser()

    const data = {
      rfc: formData.get("rfc")?.toString().trim().toUpperCase() || "",
      razon_social: formData.get("razon_social")?.toString().trim() || "",
      regimen_fiscal: formData.get("regimen_fiscal")?.toString() || "612",
      codigo_postal: formData.get("codigo_postal")?.toString().trim() || "",
      direccion: formData.get("direccion")?.toString().trim() || null,
      serie_factura: formData.get("serie_factura")?.toString().trim() || "A",
    }

    const { data: existing } = await supabase
      .from("empresa_fiscal")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    let error
    if (existing) {
      const res = await supabase
        .from("empresa_fiscal")
        .update(data)
        .eq("user_id", user.id)
      error = res.error
    } else {
      const res = await supabase.from("empresa_fiscal").insert({
        user_id: user.id,
        ...data,
      })
      error = res.error
    }

    if (error) fail(error.message, "/facturacion")

    revalidatePath("/facturacion")
    redirect("/facturacion?ok=fiscal")
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message, "/facturacion")
  }
}

export async function generarFactura(formData) {
  try {
    const ventaId = formData.get("venta_id")?.toString()
    const clienteId = formData.get("cliente_id")?.toString() || null
    if (!ventaId) fail("Selecciona una venta.", "/facturacion")

    const { supabase, user } = await requireUser()

    const { data: empresa } = await supabase
      .from("empresa_fiscal")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!empresa?.rfc || !empresa?.razon_social) {
      fail("Configura los datos fiscales del emisor primero.", "/facturacion")
    }

    const { data: venta, error: vErr } = await supabase
      .from("ventas")
      .select("*, items:venta_items(*)")
      .eq("id", ventaId)
      .eq("user_id", user.id)
      .single()

    if (vErr || !venta) fail("Venta no encontrada.", "/facturacion")

    let cliente = {
      nombre: "Público en general",
      rfc: "XAXX010101000",
      regimen_fiscal: "616",
      codigo_postal: empresa.codigo_postal,
      uso_cfdi: "S01",
    }

    if (clienteId) {
      const { data: c } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", clienteId)
        .eq("user_id", user.id)
        .single()
      if (c) {
        cliente = {
          nombre: c.nombre,
          rfc: c.rfc,
          regimen_fiscal: c.regimen_fiscal,
          codigo_postal: c.codigo_postal || empresa.codigo_postal,
          uso_cfdi: c.uso_cfdi,
        }
      }
    }

    const folio = empresa.folio_actual
    const serie = empresa.serie_factura || "A"

    const conceptos = (venta.items ?? []).map((item) => ({
      nombre: item.nombre,
      cantidad: item.cantidad,
      precio_unitario: Number(item.precio_unitario),
      subtotal: Number(item.subtotal),
      clave_sat: "01010101",
      unidad_sat: "H87",
    }))

    const xml = generarCfdiXml({
      emisor: empresa,
      receptor: cliente,
      conceptos,
      serie,
      folio,
      formaPago: venta.forma_pago,
      metodoPago: venta.metodo_pago,
      usoCfdi: cliente.uso_cfdi,
    })

    const { subtotal, iva, total } = calcularTotales(conceptos)

    const { error: fErr } = await supabase.from("facturas").insert({
      user_id: user.id,
      venta_id: venta.id,
      cliente_id: clienteId,
      serie,
      folio,
      rfc_emisor: empresa.rfc,
      rfc_receptor: cliente.rfc,
      subtotal,
      iva,
      total,
      uso_cfdi: cliente.uso_cfdi,
      forma_pago: venta.forma_pago,
      metodo_pago: venta.metodo_pago,
      estado: "pendiente",
      xml_cfdi: xml,
    })

    if (fErr) fail(fErr.message, "/facturacion")

    await supabase
      .from("empresa_fiscal")
      .update({ folio_actual: folio + 1 })
      .eq("user_id", user.id)

    revalidatePath("/facturacion")
    redirect(`/facturacion?ok=factura&folio=${folio}`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message, "/facturacion")
  }
}

export async function crearCliente(formData) {
  try {
    const nombre = formData.get("nombre")?.toString().trim()
    if (!nombre) fail("Nombre obligatorio.", "/facturacion")

    const { supabase, user } = await requireUser()
    const { error } = await supabase.from("clientes").insert({
      user_id: user.id,
      nombre,
      rfc: formData.get("rfc")?.toString().trim().toUpperCase() || "XAXX010101000",
      email: formData.get("email")?.toString().trim() || null,
      telefono: formData.get("telefono")?.toString().trim() || null,
      codigo_postal: formData.get("codigo_postal")?.toString().trim() || null,
      regimen_fiscal: formData.get("regimen_fiscal")?.toString() || "616",
      uso_cfdi: formData.get("uso_cfdi")?.toString() || "G03",
    })

    if (error) fail(error.message, "/facturacion")

    revalidatePath("/facturacion")
    redirect("/facturacion?ok=cliente")
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message, "/facturacion")
  }
}

function round2(n) {
  return Math.round(n * 100) / 100
}
