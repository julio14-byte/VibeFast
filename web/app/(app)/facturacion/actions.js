"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { calcularTotales, generarCfdiXml } from "@/lib/cfdi"
import { timbrarCfdi } from "@/lib/pac/sandbox"

const BASE = "/facturacion"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${BASE}&error=auth`)
  return { supabase, user }
}

function fail(message) {
  redirect(`${BASE}?error=${encodeURIComponent(message)}`)
}

function mapCliente(c, empresaCp) {
  return {
    nombre: c.razon_social ?? c.nombre,
    rfc: c.rfc,
    regimen_fiscal: c.regimen_fiscal,
    codigo_postal: c.codigo_postal || empresaCp,
    direccion: c.direccion,
    uso_cfdi: c.uso_cfdi,
    email: c.email,
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

    if (error) fail(error.message)

    revalidatePath(BASE)
    redirect(`${BASE}?ok=fiscal`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message)
  }
}

export async function guardarPacConfig(formData) {
  try {
    const { supabase, user } = await requireUser()

    const data = {
      pac_provider: formData.get("pac_provider")?.toString() || "sandbox",
      pac_mode: formData.get("pac_mode")?.toString() || "sandbox",
      pac_sandbox_url:
        formData.get("pac_sandbox_url")?.toString().trim() ||
        "https://sandbox.facturama.mx",
      pac_api_key: formData.get("pac_api_key")?.toString().trim() || null,
      pac_api_secret: formData.get("pac_api_secret")?.toString().trim() || null,
    }

    const { data: existing } = await supabase
      .from("empresa_fiscal")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!existing) {
      fail("Configura primero los datos fiscales del emisor.")
    }

    const { error } = await supabase
      .from("empresa_fiscal")
      .update(data)
      .eq("user_id", user.id)

    if (error) fail(error.message)

    revalidatePath(BASE)
    redirect(`${BASE}?ok=pac`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message)
  }
}

export async function generarFactura(formData) {
  try {
    const ventaId = formData.get("venta_id")?.toString()
    const clienteId = formData.get("cliente_id")?.toString() || null
    const timbrar = formData.get("timbrar")?.toString() === "1"
    if (!ventaId) fail("Selecciona una venta.")

    const { supabase, user } = await requireUser()

    const { data: empresa } = await supabase
      .from("empresa_fiscal")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!empresa?.rfc || !empresa?.razon_social) {
      fail("Configura los datos fiscales del emisor primero.")
    }

    const { data: venta, error: vErr } = await supabase
      .from("ventas")
      .select("*, items:venta_items(*)")
      .eq("id", ventaId)
      .eq("user_id", user.id)
      .single()

    if (vErr || !venta) fail("Venta no encontrada.")

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
      if (c) cliente = mapCliente(c, empresa.codigo_postal)
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

    let estado = "pendiente"
    let uuid_cfdi = null
    let xml_final = xml
    let pac_response = null
    let timbrado_at = null

    if (timbrar) {
      const timbre = await timbrarCfdi({ xml, empresa })
      if (!timbre.ok) fail(timbre.error || "Error al timbrar.")
      estado = "timbrada"
      uuid_cfdi = timbre.uuid_cfdi
      xml_final = timbre.xml_timbrado ?? xml
      pac_response = timbre.pac_response
      timbrado_at = new Date().toISOString()
    }

    const { data: factura, error: fErr } = await supabase
      .from("facturas")
      .insert({
        user_id: user.id,
        venta_id: venta.id,
        cliente_id: clienteId,
        serie,
        folio,
        uuid_cfdi,
        rfc_emisor: empresa.rfc,
        rfc_receptor: cliente.rfc,
        subtotal,
        iva,
        total,
        uso_cfdi: cliente.uso_cfdi,
        forma_pago: venta.forma_pago,
        metodo_pago: venta.metodo_pago,
        estado,
        xml_cfdi: xml_final,
        pac_response,
        timbrado_at,
      })
      .select("id")
      .single()

    if (fErr) fail(fErr.message)

    await supabase
      .from("empresa_fiscal")
      .update({ folio_actual: folio + 1 })
      .eq("user_id", user.id)

    revalidatePath(BASE)
    redirect(
      `${BASE}?ok=factura&folio=${folio}&estado=${estado}&factura_id=${factura.id}`
    )
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message)
  }
}

export async function timbrarFactura(formData) {
  try {
    const facturaId = formData.get("factura_id")?.toString()
    if (!facturaId) fail("Falta id de factura.")

    const { supabase, user } = await requireUser()

    const { data: factura } = await supabase
      .from("facturas")
      .select("*")
      .eq("id", facturaId)
      .eq("user_id", user.id)
      .single()

    if (!factura) fail("Factura no encontrada.")
    if (factura.estado === "timbrada") fail("Ya está timbrada.")

    const { data: empresa } = await supabase
      .from("empresa_fiscal")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    const timbre = await timbrarCfdi({
      xml: factura.xml_cfdi,
      empresa,
    })

    if (!timbre.ok) fail(timbre.error || "Error al timbrar.")

    const { error } = await supabase
      .from("facturas")
      .update({
        estado: "timbrada",
        uuid_cfdi: timbre.uuid_cfdi,
        xml_cfdi: timbre.xml_timbrado ?? factura.xml_cfdi,
        pac_response: timbre.pac_response,
        timbrado_at: new Date().toISOString(),
      })
      .eq("id", facturaId)
      .eq("user_id", user.id)

    if (error) fail(error.message)

    revalidatePath(BASE)
    redirect(`${BASE}?ok=timbrada&folio=${factura.folio}`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message)
  }
}
