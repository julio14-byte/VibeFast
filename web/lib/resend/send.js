// ============================================================
// Resend · helpers de envío
// ------------------------------------------------------------
// Cada helper hace no-op silencioso si el email no está
// configurado (getResend() === null). Así el resto del código
// llama sin preocuparse de si Resend está activo o no.
//
// Devuelven { ok, skipped?, error? } para que el caller decida.
// ============================================================

import config from "@/config"
import { getResend } from "@/lib/resend/client"
import WaitlistConfirm from "@/lib/resend/templates/WaitlistConfirm"
import Welcome from "@/lib/resend/templates/Welcome"
import CfdiFactura from "@/lib/resend/templates/CfdiFactura"
import CotizacionPresupuesto from "@/lib/resend/templates/CotizacionPresupuesto"

// Email genérico de texto plano. Lo usa la tool `enviar_email` del
// registry (lib/tools) para que un agente pueda mandar correos.
export async function sendEmail({ to, subject, body }) {
  const resend = getResend()
  if (!resend) return { ok: false, skipped: true }

  const { error } = await resend.emails.send({
    from: config.email.from,
    replyTo: config.email.replyTo,
    to,
    subject,
    text: body,
  })

  if (error) {
    console.error("[resend] sendEmail:", error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function sendWaitlistConfirm(to) {
  const resend = getResend()
  if (!resend) return { ok: false, skipped: true }

  const { error } = await resend.emails.send({
    from: config.email.from,
    replyTo: config.email.replyTo,
    to,
    subject: `Estás en la lista de ${config.app.name}`,
    react: <WaitlistConfirm />,
  })

  if (error) {
    console.error("[resend] waitlist confirm:", error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function sendWelcome(to, name) {
  const resend = getResend()
  if (!resend) return { ok: false, skipped: true }

  const { error } = await resend.emails.send({
    from: config.email.from,
    replyTo: config.email.replyTo,
    to,
    subject: `Bienvenido a ${config.app.name}`,
    react: <Welcome name={name} />,
  })

  if (error) {
    console.error("[resend] welcome:", error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function sendCfdiEmail({
  to,
  emisorNombre,
  receptorNombre,
  serie,
  folio,
  totalFmt,
  uuid,
  xmlContent,
  downloadUrl,
}) {
  const resend = getResend()
  if (!resend) {
    return { ok: false, skipped: true, error: "Resend no configurado." }
  }

  const filename = `CFDI_${serie}-${folio}.xml`

  const { error } = await resend.emails.send({
    from: config.email.from,
    replyTo: config.email.replyTo,
    to,
    subject: `Factura ${serie}-${folio} · ${emisorNombre || config.app.name}`,
    react: (
      <CfdiFactura
        emisorNombre={emisorNombre}
        receptorNombre={receptorNombre}
        serie={serie}
        folio={folio}
        totalFmt={totalFmt}
        uuid={uuid}
        downloadUrl={downloadUrl}
      />
    ),
    attachments: xmlContent
      ? [
          {
            filename,
            content: Buffer.from(xmlContent, "utf-8"),
          },
        ]
      : undefined,
  })

  if (error) {
    console.error("[resend] cfdi:", error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function sendCotizacionEmail({
  to,
  emisorNombre,
  receptorNombre,
  folio,
  items = [],
  subtotalFmt,
  ivaFmt,
  totalFmt,
  validezDias,
  venceFmt,
  notas,
}) {
  const resend = getResend()
  if (!resend) {
    return { ok: false, skipped: true, error: "Resend no configurado." }
  }

  const { error } = await resend.emails.send({
    from: config.email.from,
    replyTo: config.email.replyTo,
    to,
    subject: `Cotización #${folio} · ${emisorNombre || config.app.name}`,
    react: (
      <CotizacionPresupuesto
        emisorNombre={emisorNombre}
        receptorNombre={receptorNombre}
        folio={folio}
        items={items}
        subtotalFmt={subtotalFmt}
        ivaFmt={ivaFmt}
        totalFmt={totalFmt}
        validezDias={validezDias}
        venceFmt={venceFmt}
        notas={notas}
      />
    ),
  })

  if (error) {
    console.error("[resend] cotizacion:", error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
