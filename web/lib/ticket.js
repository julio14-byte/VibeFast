import { formatPrecio, normalizeNombreProducto } from "./productos"
import { formaPagoLabel, getTicketConfig } from "./negocio/empresa"

/** @deprecated Use normalizeNombreProducto */
export function ticketNombreProducto(nombre) {
  return normalizeNombreProducto(nombre)
}

export function buildTicketData({
  venta,
  items,
  empresa,
  cliente,
}) {
  const cfg = getTicketConfig(empresa)
  const fecha = new Date(venta.created_at).toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  })

  return {
    titulo: cfg.titulo,
    direccion: cfg.mostrarDireccion ? empresa?.direccion || "" : "",
    telefono: cfg.mostrarTelefono ? empresa?.telefono || "" : "",
    rfc: cfg.mostrarRfc ? empresa?.rfc || "" : "",
    textoExtra: cfg.textoExtra,
    folio: venta.folio,
    fecha,
    cliente:
      cfg.mostrarCliente && cliente
        ? {
            nombre: cliente.razon_social ?? cliente.nombre,
            rfc: cliente.rfc,
          }
        : null,
    items: items.map((i) => ({
      nombre: normalizeNombreProducto(i.nombre),
      cantidad: i.cantidad,
      precio: Number(i.precio_unitario),
      subtotal: Number(i.subtotal),
    })),
    subtotal: Number(venta.subtotal),
    iva: Number(venta.iva),
    total: Number(venta.total),
    formaPago: venta.forma_pago,
    formaPagoLabel: formaPagoLabel(venta.forma_pago),
    notas: venta.notas,
    mostrarIva: cfg.mostrarIva,
    mostrarFormaPago: cfg.mostrarFormaPago,
    mensajePie: cfg.mensajePie,
  }
}

export function formatTicketLines(data) {
  const lines = []
  lines.push(data.titulo)
  if (data.textoExtra) lines.push(data.textoExtra)
  if (data.direccion) lines.push(data.direccion)
  if (data.telefono) lines.push(`Tel: ${data.telefono}`)
  if (data.rfc) lines.push(`RFC: ${data.rfc}`)
  lines.push("--------------------------------")
  lines.push(`Ticket #${data.folio}`)
  lines.push(data.fecha)
  if (data.cliente) {
    lines.push(`Cliente: ${data.cliente.nombre}`)
    if (data.cliente.rfc) lines.push(`RFC: ${data.cliente.rfc}`)
  }
  lines.push("--------------------------------")
  for (const item of data.items) {
    lines.push(item.nombre)
    lines.push(
      `  ${item.cantidad} x ${formatPrecio(item.precio)} = ${formatPrecio(item.subtotal)}`
    )
  }
  lines.push("--------------------------------")
  if (data.mostrarIva) {
    lines.push(`Subtotal: ${formatPrecio(data.subtotal)}`)
    lines.push(`IVA:      ${formatPrecio(data.iva)}`)
  }
  lines.push(`TOTAL:    ${formatPrecio(data.total)}`)
  if (data.mostrarFormaPago && data.formaPagoLabel) {
    lines.push(`Pago: ${data.formaPagoLabel}`)
  }
  if (data.notas) lines.push(`Notas: ${data.notas}`)
  lines.push("--------------------------------")
  lines.push(data.mensajePie || "¡Gracias por su compra!")
  return lines
}

// Comandos ESC/POS básicos para impresoras térmicas (futuro USB/serial)
export function toEscPos(lines) {
  const ESC = "\x1B"
  const INIT = ESC + "@"
  const CENTER = ESC + "a" + "\x01"
  const LEFT = ESC + "a" + "\x00"
  const BOLD_ON = ESC + "E" + "\x01"
  const BOLD_OFF = ESC + "E" + "\x00"
  const CUT = ESC + "i"

  let out = INIT + CENTER + BOLD_ON
  out += lines[0] + "\n"
  out += BOLD_OFF
  for (let i = 1; i < lines.length; i++) {
    out += LEFT + lines[i] + "\n"
  }
  out += "\n\n" + CUT
  return out
}
