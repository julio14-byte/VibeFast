// Cliente PAC sandbox para timbrado CFDI.
// En producción, reemplaza con el SDK del PAC elegido (Finkok, SW, Facturama).

import { randomUUID } from "crypto"

export const PAC_PROVIDERS = [
  { id: "sandbox", nombre: "Sandbox (simulado)" },
  { id: "facturama", nombre: "Facturama" },
  { id: "finkok", nombre: "Finkok" },
  { id: "sw", nombre: "SW Sapien" },
]

/**
 * Timbrado en sandbox: simula respuesta PAC sin llamar servicio externo.
 * Si pac_mode === 'production' y hay credenciales, intenta llamar al PAC real.
 */
export async function timbrarCfdi({ xml, empresa }) {
  const mode = empresa?.pac_mode ?? "sandbox"
  const provider = empresa?.pac_provider ?? "sandbox"

  if (mode === "sandbox" || provider === "sandbox") {
    return timbrarSandbox(xml)
  }

  // Futuro: integración PAC real
  if (provider === "facturama" && empresa?.pac_api_key) {
    return await timbrarFacturamaSandbox(xml, empresa)
  }

  // Sin credenciales de producción, usar sandbox local
  return timbrarSandbox(xml)
}

function timbrarSandbox(xml) {
  const uuid = randomUUID().toUpperCase()
  const now = new Date().toISOString()

  return {
    ok: true,
    sandbox: true,
    uuid_cfdi: uuid,
    xml_timbrado: wrapTimbradoXml(xml, uuid, now),
    pac_response: {
      provider: "sandbox",
      mode: "sandbox",
      message: "Timbrado simulado. Conecta un PAC real en Facturación.",
      uuid,
      fechaTimbrado: now,
    },
  }
}

async function timbrarFacturamaSandbox(xml, empresa) {
  const baseUrl =
    empresa.pac_sandbox_url?.replace(/\/$/, "") ||
    "https://sandbox.facturama.mx"
  const auth = Buffer.from(
    `${empresa.pac_api_key}:${empresa.pac_api_secret || ""}`
  ).toString("base64")

  try {
    const res = await fetch(`${baseUrl}/api-lite/cfdis`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ Cfdi: xml }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      const errText = await res.text()
      return {
        ok: false,
        error: `PAC respondió ${res.status}: ${errText.slice(0, 200)}`,
      }
    }

    const data = await res.json()
    return {
      ok: true,
      sandbox: true,
      uuid_cfdi: data?.Complement?.TaxStamp?.Uuid ?? randomUUID().toUpperCase(),
      xml_timbrado: data?.Cfdi ?? xml,
      pac_response: data,
    }
  } catch (err) {
    return {
      ok: false,
      error: `Error conectando PAC sandbox: ${err.message}`,
    }
  }
}

function wrapTimbradoXml(xml, uuid, fecha) {
  return `${xml}\n<!-- TimbreFiscalDigital Simulado UUID="${uuid}" FechaTimbrado="${fecha}" -->`
}
