// Enlaces y envío WhatsApp para CFDI.

export function normalizeWhatsAppPhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "")
  if (!digits) return null
  if (digits.length === 10) return `52${digits}`
  if (digits.startsWith("52") && digits.length === 12) return digits
  if (digits.length >= 10) return digits
  return null
}

export function buildWhatsAppLink(phone, message) {
  const normalized = normalizeWhatsAppPhone(phone)
  if (!normalized) return null
  const text = encodeURIComponent(message)
  return `https://wa.me/${normalized}?text=${text}`
}

export function buildCfdiWhatsAppMessage({
  emisorNombre,
  serie,
  folio,
  totalFmt,
  uuid,
  downloadUrl,
}) {
  const lines = [
    `Hola, te enviamos tu factura electrónica (CFDI) de ${emisorNombre || "nuestra ferretería"}.`,
    ``,
    `Serie/Folio: ${serie}-${folio}`,
    `Total: ${totalFmt}`,
  ]
  if (uuid) lines.push(`UUID: ${uuid}`)
  if (downloadUrl) {
    lines.push("")
    lines.push(`Descargar XML: ${downloadUrl}`)
  } else {
    lines.push("")
    lines.push("Solicita el archivo XML en mostrador o por correo electrónico.")
  }
  lines.push(``)
  lines.push("Gracias por tu compra.")
  return lines.join("\n")
}

/**
 * Envío vía WhatsApp Cloud API (Meta) si hay credenciales.
 * Requiere WHATSAPP_ACCESS_TOKEN y WHATSAPP_PHONE_NUMBER_ID.
 */
export async function sendWhatsAppCloudMessage({ to, text }) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneId) {
    return {
      ok: false,
      skipped: true,
      error: "WhatsApp API no configurada. Usa el enlace wa.me.",
    }
  }

  const normalized = normalizeWhatsAppPhone(to)
  if (!normalized) {
    return { ok: false, error: "Número de WhatsApp inválido." }
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: normalized,
          type: "text",
          text: { body: text },
        }),
        signal: AbortSignal.timeout(15000),
      }
    )

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return {
        ok: false,
        error: data?.error?.message || `WhatsApp API error ${res.status}`,
      }
    }

    return { ok: true, response: data }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}
