/**
 * Formatea resultados de herramientas del asistente para mostrar en el chat.
 * Sin dependencias de servidor — seguro para componentes cliente.
 */

function formatProducto(producto) {
  if (!producto) return ""
  const lines = [
    `- Código: ${producto.codigo}`,
    `- Nombre: ${producto.descripcion ?? producto.nombre}`,
    `- Stock: ${producto.stock}`,
  ]
  if (producto.precio_compra != null) {
    lines.push(`- Precio compra: $${producto.precio_compra}`)
  }
  if (producto.precio_mayoreo != null) {
    lines.push(`- Precio mayoreo: $${producto.precio_mayoreo}`)
  }
  const pub = producto.precio_publico ?? producto.precio
  if (pub != null) lines.push(`- Precio público: $${pub}`)
  return lines.join("\n")
}

export function formatToolResult(name, result) {
  if (name === "crear_producto" && result?.ok) {
    const p = result.producto
    const msg =
      result.mensaje ??
      `Producto "${p?.nombre ?? p?.descripcion}" (código ${p?.codigo}) registrado correctamente.`
    return `${msg}\n${formatProducto(p)}`
  }
  if (name === "crear_producto" && result?.error) {
    return `No se pudo crear el producto: ${result.error}`
  }
  if (name === "ajustar_inventario" && result?.ok) {
    const msg = result.mensaje ?? "Producto actualizado correctamente."
    return `${msg}\n${formatProducto(result.producto)}`
  }
  if (name === "ajustar_inventario" && result?.error) {
    return `No se pudo actualizar el producto: ${result.error}`
  }
  if (name === "gestionar_inventario" && result?.ok) {
    const msg =
      result.mensaje ??
      `Producto ${result.accion === "creado" ? "registrado" : "actualizado"} correctamente.`
    return `${msg}\n${formatProducto(result.producto)}`
  }
  if (name === "gestionar_inventario" && result?.error) {
    return `No se pudo gestionar el inventario: ${result.error}`
  }
  if (name === "buscar_productos" && result?.ok) {
    if (!result.total) return "No encontré productos con ese criterio."
    return result.productos
      .map(
        (p) =>
          `- Código ${p.codigo}: ${p.descripcion} · Stock ${p.stock} · Público $${p.precio_publico ?? "—"} · Mayoreo $${p.precio_mayoreo ?? "—"}`
      )
      .join("\n")
  }
  if (name === "registrar_venta" && result?.ok) {
    return result.mensaje ?? "Venta registrada."
  }
  if (name === "registrar_venta" && result?.error) {
    return `No se pudo registrar la venta: ${result.error}`
  }
  if (result?.error) return `Error: ${result.error}`
  return ""
}

export function formatChatEvent(event) {
  switch (event.type) {
    case "token":
      return event.text || ""
    case "reasoning":
      if (!event.text || event.text === "(ejecutando herramienta)") return ""
      return `\n${event.text}\n`
    case "tool_call":
      return `\n${formatToolResult(event.name, event.result)}\n`
    default:
      return ""
  }
}
