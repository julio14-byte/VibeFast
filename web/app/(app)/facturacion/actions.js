"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { timbrarCfdi } from "@/lib/pac/sandbox"
import { generarFacturaInterna } from "@/lib/facturacion/generarFacturaInterna"
import { ensureClientePublicoGeneral } from "@/lib/clientes/publicoGeneral"
import { formatPrecio } from "@/lib/productos"
import { sendCfdiEmail } from "@/lib/resend/send"
import {
  buildCfdiWhatsAppMessage,
  buildWhatsAppLink,
  sendWhatsAppCloudMessage,
} from "@/lib/whatsapp"
import { requireOrgContext } from "@/lib/organization/context"
import config from "@/config"

const BASE = "/facturacion"

async function requireUser() {
  return requireOrgContext(BASE)
}

function fail(message) {
  redirect(`${BASE}?error=${encodeURIComponent(message)}`)
}

export async function generarFactura(formData) {
  try {
    const ventaId = formData.get("venta_id")?.toString()
    let clienteId = formData.get("cliente_id")?.toString() || null
    const usoCfdiOverride = formData.get("uso_cfdi")?.toString().trim() || null
    const timbrar = formData.get("timbrar")?.toString() === "1"
    if (!ventaId) fail("Selecciona una venta.")

    const { supabase, user, organizationId } = await requireUser()

    if (!clienteId) {
      const { data: empresa } = await supabase
        .from("empresa_fiscal")
        .select("codigo_postal")
        .eq("organization_id", organizationId)
        .maybeSingle()
      const publico = await ensureClientePublicoGeneral(
        supabase,
        organizationId,
        user.id,
        empresa?.codigo_postal
      )
      clienteId = publico.id
    }

    const factura = await generarFacturaInterna({
      supabase,
      userId: user.id,
      organizationId,
      ventaId,
      clienteId,
      usoCfdiOverride,
      timbrar,
    })

    revalidatePath(BASE)
    redirect(
      `${BASE}?ok=factura&folio=${factura.folio}&estado=${factura.estado}&factura_id=${factura.id}`
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

    const { supabase, organizationId } = await requireUser()

    const { data: factura } = await supabase
      .from("facturas")
      .select("*")
      .eq("id", facturaId)
      .eq("organization_id", organizationId)
      .single()

    if (!factura) fail("Factura no encontrada.")
    if (factura.estado === "timbrada") fail("Ya está timbrada.")

    const { data: empresa } = await supabase
      .from("empresa_fiscal")
      .select("*")
      .eq("organization_id", organizationId)
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
      .eq("organization_id", organizationId)

    if (error) fail(error.message)

    revalidatePath(BASE)
    redirect(`${BASE}?ok=timbrada&folio=${factura.folio}`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message)
  }
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || config.app.defaultUrl
}

async function loadFacturaForEnvio(supabase, organizationId, facturaId) {
  const { data: factura } = await supabase
    .from("facturas")
    .select("*, cliente:clientes(*)")
    .eq("id", facturaId)
    .eq("organization_id", organizationId)
    .single()

  if (!factura) return null

  const { data: empresa } = await supabase
    .from("empresa_fiscal")
    .select("razon_social")
    .eq("organization_id", organizationId)
    .maybeSingle()

  return { factura, empresa }
}

export async function enviarCfdiPorEmail(formData) {
  try {
    const facturaId = formData.get("factura_id")?.toString()
    const emailOverride = formData.get("email")?.toString().trim()

    if (!facturaId) fail("Falta la factura.")

    const { supabase, organizationId } = await requireUser()
    const loaded = await loadFacturaForEnvio(supabase, organizationId, facturaId)
    if (!loaded) fail("Factura no encontrada.")

    const { factura, empresa } = loaded
    const to = emailOverride || factura.cliente?.email || null

    if (!to) fail("Indica un correo o registra email en el cliente.")

    const downloadUrl = `${getAppUrl()}/api/cfdi/${factura.id}/xml`
    const receptorNombre =
      factura.cliente?.razon_social ?? factura.cliente?.nombre ?? "Cliente"

    const result = await sendCfdiEmail({
      to,
      emisorNombre: empresa?.razon_social ?? config.app.name,
      receptorNombre,
      serie: factura.serie,
      folio: factura.folio,
      totalFmt: formatPrecio(factura.total),
      uuid: factura.uuid_cfdi ?? "",
      xmlContent: factura.xml_cfdi,
      downloadUrl,
    })

    if (!result.ok) {
      fail(result.error || "No se pudo enviar el correo.")
    }

    await supabase
      .from("facturas")
      .update({
        email_enviado_at: new Date().toISOString(),
        ultimo_envio_destino: to,
      })
      .eq("id", facturaId)
      .eq("organization_id", organizationId)

    revalidatePath(BASE)
    redirect(`${BASE}?ok=email&folio=${factura.folio}`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message)
  }
}

export async function enviarCfdiPorWhatsApp(formData) {
  try {
    const facturaId = formData.get("factura_id")?.toString()
    const telefono =
      formData.get("telefono")?.toString().trim() ||
      formData.get("whatsapp")?.toString().trim()

    if (!facturaId) fail("Falta la factura.")
    if (!telefono) fail("Indica el número de WhatsApp.")

    const { supabase, organizationId } = await requireUser()
    const loaded = await loadFacturaForEnvio(supabase, organizationId, facturaId)
    if (!loaded) fail("Factura no encontrada.")

    const { factura, empresa } = loaded
    const message = buildCfdiWhatsAppMessage({
      emisorNombre: empresa?.razon_social ?? config.app.name,
      serie: factura.serie,
      folio: factura.folio,
      totalFmt: formatPrecio(factura.total),
      uuid: factura.uuid_cfdi,
      downloadUrl: null,
    })

    const apiResult = await sendWhatsAppCloudMessage({
      to: telefono,
      text: message,
    })

    if (!apiResult.ok && !apiResult.skipped) {
      fail(apiResult.error || "Error al enviar WhatsApp.")
    }

    if (apiResult.skipped) {
      const waLink = buildWhatsAppLink(telefono, message)
      if (!waLink) fail("Número de WhatsApp inválido.")
      revalidatePath(BASE)
      redirect(`${BASE}?ok=whatsapp_link&url=${encodeURIComponent(waLink)}`)
    }

    await supabase
      .from("facturas")
      .update({
        whatsapp_enviado_at: new Date().toISOString(),
        ultimo_envio_destino: telefono,
      })
      .eq("id", facturaId)
      .eq("organization_id", organizationId)

    revalidatePath(BASE)
    redirect(`${BASE}?ok=whatsapp&folio=${factura.folio}`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message)
  }
}
