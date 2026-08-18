import config from "@/config"
import { formatPrecio } from "@/lib/productos"

function formatValidezLine(validezDias, venceAt) {
  const dias = Math.max(1, Number(validezDias) || 7)
  const plural = dias === 1 ? "" : "s"
  if (venceAt) {
    const fecha = new Date(venceAt).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    return `Válida ${dias} día${plural} (hasta el ${fecha}). Precios con IVA incluido en total.`
  }
  return `Válida ${dias} día${plural}. Precios con IVA incluido en total.`
}

export function buildCotizacionWhatsAppMessage({
  folio,
  items = [],
  subtotal,
  iva,
  total,
  validezDias = 7,
  venceAt,
  notas,
  clienteNombre,
}) {
  const appName = config.app.name
  const lines = [
    `*Cotización ${appName}*`,
    `Presupuesto #${folio}`,
  ]

  if (clienteNombre) {
    lines.push(`Cliente: ${clienteNombre}`)
  }

  lines.push("", "*Productos:*")

  for (const item of items) {
    lines.push(
      `• ${item.nombre} (cód. ${item.codigo})`,
      `  ${item.cantidad} × ${formatPrecio(item.precio_unitario)} = ${formatPrecio(item.subtotal)}`
    )
  }

  lines.push(
    "",
    `Subtotal (sin IVA): ${formatPrecio(subtotal)}`,
    `IVA (16%): ${formatPrecio(iva)}`,
    `*Total: ${formatPrecio(total)}*`,
    "",
    formatValidezLine(validezDias, venceAt)
  )

  if (notas?.trim()) {
    lines.push("", `Notas: ${notas.trim()}`)
  }

  return lines.join("\n")
}
