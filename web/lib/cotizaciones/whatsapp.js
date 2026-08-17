import config from "@/config"
import { formatPrecio } from "@/lib/productos"

export function buildCotizacionWhatsAppMessage({
  folio,
  items = [],
  subtotal,
  iva,
  total,
  validezDias = 7,
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
    `Válida ${validezDias} días. Precios con IVA incluido en total.`
  )

  if (notas?.trim()) {
    lines.push("", `Notas: ${notas.trim()}`)
  }

  lines.push("", "¿Te la apartamos? Responde para confirmar.")
  return lines.join("\n")
}
