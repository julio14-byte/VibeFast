"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { calcularTotalesDesdePreciosConIva, desglosarPrecioConIva } from "@/lib/cfdi"
import { buildCotizacionWhatsAppMessage } from "@/lib/cotizaciones/whatsapp"
import { cotizacionPuedeConvertir } from "@/lib/cotizaciones/labels"
import { buildWhatsAppLink, sendWhatsAppCloudMessage } from "@/lib/whatsapp"
import { generarFacturaInterna } from "@/lib/facturacion/generarFacturaInterna"
import { sendCotizacionEmail } from "@/lib/resend/send"
import { formatPrecio } from "@/lib/productos"
import config from "@/config"

const BASE = "/cotizaciones"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${BASE}&error=auth`)
  return { supabase, user }
}

function fail(message, path = BASE) {
  redirect(`${path}?error=${encodeURIComponent(message)}`)
}

function round2(n) {
  return Math.round(n * 100) / 100
}

async function getNextCotizacionFolio(supabase, userId) {
  const { data } = await supabase
    .from("cotizaciones")
    .select("folio")
    .eq("user_id", userId)
    .order("folio", { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data?.folio ?? 0) + 1
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

async function loadCotizacion(supabase, userId, cotizacionId) {
  const { data, error } = await supabase
    .from("cotizaciones")
    .select("*, items:cotizacion_items(*), cliente:clientes(id, nombre, razon_social, telefono, email)")
    .eq("id", cotizacionId)
    .eq("user_id", userId)
    .single()

  if (error || !data) return null
  return data
}

function parseCartItems(itemsJson) {
  if (!itemsJson) return null
  let items
  try {
    items = JSON.parse(itemsJson)
  } catch {
    return null
  }
  if (!Array.isArray(items) || items.length === 0) return null
  return items
}

async function buildLineasFromCart(supabase, userId, items, tipoPrecio) {
  const lineas = []

  for (const item of items) {
    const cantidad = Number(item.cantidad)
    const productoId = item.producto_id

    if (!productoId || !Number.isInteger(cantidad) || cantidad <= 0) {
      throw new Error("Cantidad inválida en un producto.")
    }

    const { data: producto, error: pErr } = await supabase
      .from("productos")
      .select("*")
      .eq("id", productoId)
      .eq("user_id", userId)
      .single()

    if (pErr || !producto) throw new Error("Producto no encontrado.")

    const precioConIva =
      tipoPrecio === "mayoreo"
        ? Number(producto.precio_mayoreo ?? producto.precio)
        : Number(producto.precio_publico ?? producto.precio)

    const subtotalLinea = round2(precioConIva * cantidad)

    lineas.push({
      producto_id: producto.id,
      codigo: producto.codigo,
      nombre: producto.nombre,
      cantidad,
      precio_unitario: precioConIva,
      subtotal: subtotalLinea,
      stock: producto.stock,
    })
  }

  return lineas
}

export async function crearCotizacion(formData) {
  try {
    const itemsJson = formData.get("items")?.toString()
    const tipoPrecio = formData.get("tipo_precio")?.toString() || "publico"
    const formaPago = formData.get("forma_pago")?.toString() || "01"
    const notas = formData.get("notas")?.toString().trim() || null
    const clienteId = formData.get("cliente_id")?.toString() || null
    const telefono = formData.get("telefono_whatsapp")?.toString().trim() || null
    const validezDias = Math.min(90, Math.max(1, Number(formData.get("validez_dias")) || 7))

    const items = parseCartItems(itemsJson)
    if (!items) fail("Agrega al menos un producto.", `${BASE}/nueva`)

    const { supabase, user } = await requireUser()
    const lineas = await buildLineasFromCart(supabase, user.id, items, tipoPrecio)
    const { subtotal, iva, total } = calcularTotalesDesdePreciosConIva(lineas)
    const folio = await getNextCotizacionFolio(supabase, user.id)

    const venceAt = new Date()
    venceAt.setDate(venceAt.getDate() + validezDias)

    const { data: cotizacion, error: cErr } = await supabase
      .from("cotizaciones")
      .insert({
        user_id: user.id,
        cliente_id: clienteId,
        folio,
        tipo_precio: tipoPrecio,
        subtotal,
        iva,
        total,
        forma_pago: formaPago,
        notas,
        validez_dias: validezDias,
        vence_at: venceAt.toISOString(),
        telefono_whatsapp: telefono,
        estado: "borrador",
      })
      .select("id")
      .single()

    if (cErr) fail(cErr.message, `${BASE}/nueva`)

    const cotizacionItems = lineas.map((l) => ({
      cotizacion_id: cotizacion.id,
      producto_id: l.producto_id,
      codigo: l.codigo,
      nombre: l.nombre,
      cantidad: l.cantidad,
      precio_unitario: l.precio_unitario,
      subtotal: l.subtotal,
    }))

    const { error: itemsErr } = await supabase.from("cotizacion_items").insert(cotizacionItems)
    if (itemsErr) fail(itemsErr.message, `${BASE}/nueva`)

    revalidatePath(BASE)
    redirect(`${BASE}/${cotizacion.id}?ok=creada`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message || "Error al crear la cotización.", `${BASE}/nueva`)
  }
}

export async function enviarCotizacionWhatsApp(formData) {
  try {
    const cotizacionId = formData.get("cotizacion_id")?.toString()
    const telefono =
      formData.get("telefono_whatsapp")?.toString().trim() || null

    if (!cotizacionId) fail("Falta la cotización.")

    const { supabase, user } = await requireUser()
    const cotizacion = await loadCotizacion(supabase, user.id, cotizacionId)
    if (!cotizacion) fail("Cotización no encontrada.")

    const phone =
      telefono ||
      cotizacion.telefono_whatsapp ||
      cotizacion.cliente?.telefono

    if (!phone) fail("Indica el WhatsApp del cliente.", `${BASE}/${cotizacionId}`)

    const message = buildCotizacionWhatsAppMessage({
      folio: cotizacion.folio,
      items: cotizacion.items ?? [],
      subtotal: cotizacion.subtotal,
      iva: cotizacion.iva,
      total: cotizacion.total,
      validezDias: cotizacion.validez_dias,
      notas: cotizacion.notas,
      clienteNombre: cotizacion.cliente?.razon_social ?? cotizacion.cliente?.nombre,
    })

    const apiResult = await sendWhatsAppCloudMessage({ to: phone, text: message })

    if (!apiResult.ok && !apiResult.skipped) {
      fail(apiResult.error || "Error al enviar WhatsApp.", `${BASE}/${cotizacionId}`)
    }

    const patch = {
      telefono_whatsapp: phone,
      whatsapp_enviado_at: new Date().toISOString(),
      estado: cotizacion.estado === "borrador" ? "enviada" : cotizacion.estado,
    }

    await supabase.from("cotizaciones").update(patch).eq("id", cotizacionId)

    revalidatePath(BASE)
    revalidatePath(`${BASE}/${cotizacionId}`)

    if (apiResult.skipped) {
      const waLink = buildWhatsAppLink(phone, message)
      if (!waLink) fail("Número de WhatsApp inválido.", `${BASE}/${cotizacionId}`)
      redirect(
        `${BASE}/${cotizacionId}?ok=whatsapp_link&url=${encodeURIComponent(waLink)}`
      )
    }

    redirect(`${BASE}/${cotizacionId}?ok=whatsapp`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message)
  }
}

export async function enviarCotizacionEmail(formData) {
  try {
    const cotizacionId = formData.get("cotizacion_id")?.toString()
    const emailOverride = formData.get("email")?.toString().trim() || null

    if (!cotizacionId) fail("Falta la cotización.")

    const { supabase, user } = await requireUser()
    const cotizacion = await loadCotizacion(supabase, user.id, cotizacionId)
    if (!cotizacion) fail("Cotización no encontrada.")

    const to =
      emailOverride ||
      cotizacion.cliente?.email ||
      null

    if (!to) {
      fail(
        "Indica el correo del cliente o regístralo en Clientes.",
        `${BASE}/${cotizacionId}`
      )
    }

    const { data: empresa } = await supabase
      .from("empresa_fiscal")
      .select("razon_social")
      .eq("user_id", user.id)
      .maybeSingle()

    const emisorNombre = empresa?.razon_social ?? config.app.name
    const receptorNombre =
      cotizacion.cliente?.razon_social ?? cotizacion.cliente?.nombre ?? "Cliente"

    const items = (cotizacion.items ?? []).map((item) => ({
      nombre: item.nombre,
      codigo: item.codigo,
      cantidad: item.cantidad,
      precioFmt: formatPrecio(item.precio_unitario),
      subtotalFmt: formatPrecio(item.subtotal),
    }))

    const result = await sendCotizacionEmail({
      to,
      emisorNombre,
      receptorNombre,
      folio: cotizacion.folio,
      items,
      subtotalFmt: formatPrecio(cotizacion.subtotal),
      ivaFmt: formatPrecio(cotizacion.iva),
      totalFmt: formatPrecio(cotizacion.total),
      validezDias: cotizacion.validez_dias,
      venceFmt: new Date(cotizacion.vence_at).toLocaleDateString("es-MX"),
      notas: cotizacion.notas,
    })

    if (!result.ok) {
      fail(
        result.error || "No se pudo enviar el correo.",
        `${BASE}/${cotizacionId}`
      )
    }

    const patch = {
      email_destino: to,
      email_enviado_at: new Date().toISOString(),
      estado: cotizacion.estado === "borrador" ? "enviada" : cotizacion.estado,
    }

    await supabase.from("cotizaciones").update(patch).eq("id", cotizacionId)

    revalidatePath(BASE)
    revalidatePath(`${BASE}/${cotizacionId}`)

    redirect(`${BASE}/${cotizacionId}?ok=email`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message)
  }
}

export async function rechazarCotizacion(formData) {
  try {
    const cotizacionId = formData.get("cotizacion_id")?.toString()
    if (!cotizacionId) fail("Falta la cotización.")

    const { supabase, user } = await requireUser()
    const cotizacion = await loadCotizacion(supabase, user.id, cotizacionId)
    if (!cotizacion) fail("Cotización no encontrada.")
    if (cotizacion.estado === "convertida") {
      fail("Esta cotización ya se convirtió en venta.", `${BASE}/${cotizacionId}`)
    }

    await supabase
      .from("cotizaciones")
      .update({ estado: "rechazada" })
      .eq("id", cotizacionId)

    revalidatePath(BASE)
    redirect(`${BASE}/${cotizacionId}?ok=rechazada`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message)
  }
}

/**
 * Convierte cotización aprobada en venta (descuenta stock).
 * @returns {{ ventaId, folio, total }}
 */
export async function convertirCotizacionAVentaInterna(
  supabase,
  userId,
  cotizacion
) {
  if (!cotizacionPuedeConvertir(cotizacion.estado)) {
    throw new Error("Esta cotización ya no se puede convertir en venta.")
  }

  if (cotizacion.venta_id) {
    return { ventaId: cotizacion.venta_id, alreadyConverted: true }
  }

  const items = cotizacion.items ?? []
  if (!items.length) throw new Error("La cotización no tiene productos.")

  const folio = await getNextVentaFolio(supabase, userId)

  for (const item of items) {
    if (!item.producto_id) continue

    const { data: producto, error: pErr } = await supabase
      .from("productos")
      .select("stock, nombre")
      .eq("id", item.producto_id)
      .eq("user_id", userId)
      .single()

    if (pErr || !producto) {
      throw new Error(`Producto "${item.nombre}" ya no existe.`)
    }
    if (producto.stock < item.cantidad) {
      throw new Error(
        `Stock insuficiente de "${item.nombre}" (hay ${producto.stock}, se pidieron ${item.cantidad}).`
      )
    }

    const { error: stockErr } = await supabase
      .from("productos")
      .update({ stock: producto.stock - item.cantidad })
      .eq("id", item.producto_id)
      .eq("user_id", userId)

    if (stockErr) throw new Error(stockErr.message)
  }

  const { data: venta, error: ventaErr } = await supabase
    .from("ventas")
    .insert({
      user_id: userId,
      cliente_id: cotizacion.cliente_id,
      cotizacion_id: cotizacion.id,
      folio,
      tipo_precio: cotizacion.tipo_precio,
      subtotal: cotizacion.subtotal,
      iva: cotizacion.iva,
      total: cotizacion.total,
      forma_pago: cotizacion.forma_pago,
      metodo_pago: "PUE",
      notas: cotizacion.notas
        ? `Desde cotización #${cotizacion.folio}. ${cotizacion.notas}`
        : `Desde cotización #${cotizacion.folio}`,
    })
    .select("id, folio, total")
    .single()

  if (ventaErr) throw new Error(ventaErr.message)

  const ventaItems = items.map((item) => ({
    venta_id: venta.id,
    producto_id: item.producto_id,
    codigo: item.codigo,
    nombre: item.nombre,
    cantidad: item.cantidad,
    precio_unitario: item.precio_unitario,
    subtotal: item.subtotal,
  }))

  const { error: itemsErr } = await supabase.from("venta_items").insert(ventaItems)
  if (itemsErr) throw new Error(itemsErr.message)

  await supabase
    .from("cotizaciones")
    .update({ estado: "convertida", venta_id: venta.id })
    .eq("id", cotizacion.id)

  return { ventaId: venta.id, folio: venta.folio, total: venta.total }
}

export async function convertirCotizacionAVenta(formData) {
  try {
    const cotizacionId = formData.get("cotizacion_id")?.toString()
    const imprimirTicket = formData.get("imprimir_ticket")?.toString() === "1"

    if (!cotizacionId) fail("Falta la cotización.")

    const { supabase, user } = await requireUser()
    const cotizacion = await loadCotizacion(supabase, user.id, cotizacionId)
    if (!cotizacion) fail("Cotización no encontrada.")

    const { ventaId, folio, total } = await convertirCotizacionAVentaInterna(
      supabase,
      user.id,
      cotizacion
    )

    revalidatePath(BASE)
    revalidatePath("/ventas")
    revalidatePath("/inventario")
    revalidatePath("/productos")

    if (imprimirTicket) {
      redirect(`/ventas/ticket/${ventaId}?print=1`)
    }

    redirect(
      `${BASE}/${cotizacionId}?ok=venta&venta_folio=${folio}&venta_total=${total}&venta_id=${ventaId}`
    )
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    const id = formData.get("cotizacion_id")?.toString()
    fail(err?.message || "Error al convertir en venta.", id ? `${BASE}/${id}` : BASE)
  }
}

export async function convertirCotizacionYFacturar(formData) {
  try {
    const cotizacionId = formData.get("cotizacion_id")?.toString()
    const clienteId = formData.get("cliente_id")?.toString() || null
    const timbrar = formData.get("timbrar")?.toString() === "1"

    if (!cotizacionId) fail("Falta la cotización.")

    const { supabase, user } = await requireUser()
    let cotizacion = await loadCotizacion(supabase, user.id, cotizacionId)
    if (!cotizacion) fail("Cotización no encontrada.")

    let ventaId = cotizacion.venta_id

    if (!ventaId) {
      const result = await convertirCotizacionAVentaInterna(
        supabase,
        user.id,
        cotizacion
      )
      ventaId = result.ventaId
      cotizacion = await loadCotizacion(supabase, user.id, cotizacionId)
    }

    const clienteFactura = clienteId || cotizacion.cliente_id

    const factura = await generarFacturaInterna({
      supabase,
      userId: user.id,
      ventaId,
      clienteId: clienteFactura,
      timbrar,
    })

    revalidatePath(BASE)
    revalidatePath("/ventas")
    revalidatePath("/facturacion")
    revalidatePath("/inventario")
    revalidatePath("/productos")

    redirect(
      `${BASE}/${cotizacionId}?ok=factura&factura_folio=${factura.folio}&factura_estado=${factura.estado}&factura_id=${factura.id}`
    )
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    const id = formData.get("cotizacion_id")?.toString()
    fail(err?.message || "Error al facturar.", id ? `${BASE}/${id}` : BASE)
  }
}
