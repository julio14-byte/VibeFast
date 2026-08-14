function getLastUserMessage(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content || ""
  }
  return ""
}

function normalizeProductText(text) {
  return text
    .replace(/\*\*/g, " ")
    .replace(/^[\-*•]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function looksLikeGenericRefusal(content) {
  if (!content) return false
  return /sistema de gesti[oó]n|software o sistema|no tengo acceso|pasos generales|inicia sesi[oó]n|ejemplo de c[oó]mo|campos correspondientes|formato espec[ií]fico|base de datos|ingresar estos datos|plataforma|pasos necesarios|contexto o la plataforma|registro en un sistema|ind[ií]came|acci[oó]n adicional|guardar estos datos|por favor ind[ií]calo|detalles:|aqu[ií] tienes|h[aá]zmelo saber|otra acci[oó]n o registro|puedes utilizar el siguiente formato|consulta adecuada|formular el comando|m[aá]s detalles sobre el contexto|```plaintext/i.test(
    content
  )
}

export function looksLikeFakeSuccess(content) {
  if (!content) return false
  return /informaci[oó]n registrada|aqu[ií] tienes la informaci[oó]n|claro, aqu[ií] tienes/i.test(
    content
  )
}

export function parseGestionarInventarioArgs(text) {
  if (!text?.trim()) return null
  const normalized = normalizeProductText(text)

  const codigo =
    normalized.match(/c[oó]digo\s*(?:de\s*)?:?\s*["'""]?(\d+)["'""]?/i)?.[1] ??
    normalized.match(/\bc[oó]digo\s+["'""]?(\d+)["'""]?/i)?.[1]

  const nombre =
    normalized.match(/producto\s+["'""]([^"'""]+)["'""]/i)?.[1] ??
    normalized.match(/nombre\s*(?:de\s*)?:?\s*["'""]([^"'""]+)["'""]/i)?.[1] ??
    normalized.match(/nombre\s*(?:de\s*)?:?\s*(.+?)(?=\s+precio|\s+stock|$)/i)?.[1]

  const precio =
    normalized.match(/precio\s+p[uú]blico\s*:?\s*\$?\s*([\d.]+)/i)?.[1] ??
    normalized.match(/precio(?:\s+de)?\s*:?\s*\$?\s*([\d.]+)/i)?.[1] ??
    normalized.match(/\$\s*([\d.]+)/)?.[1]

  const stock =
    normalized.match(/stock(?:\s+inicial)?(?:\s+de)?\s*:?\s*(\d+)/i)?.[1] ??
    normalized.match(/(?:un\s+)?stock\s+de\s+(\d+)/i)?.[1] ??
    normalized.match(/(\d+)\s+unidades/i)?.[1]

  if (!codigo || !nombre || !precio || !stock) return null

  const codigoNum = Number(codigo)
  if (!Number.isInteger(codigoNum) || codigoNum <= 0) return null

  return {
    nombre: nombre.trim(),
    codigo: codigoNum,
    precio: Number.parseFloat(precio),
    stock: Number(stock),
  }
}

export function parseCreateProductArgs(text) {
  if (!text?.trim()) return null
  const normalized = normalizeProductText(text)

  const codigo =
    normalized.match(/c[oó]digo\s*(?:de\s*)?:?\s*(\d+)/i)?.[1] ??
    normalized.match(/\bc[oó]digo\s+(\d+)/i)?.[1]

  const nombre =
    normalized.match(/producto\s+["'""]([^"'""]+)["'""]/i)?.[1] ??
    normalized.match(/nombre\s*(?:de\s*)?:?\s*["'""]([^"'""]+)["'""]/i)?.[1] ??
    normalized.match(/nombre\s*(?:de\s*)?:?\s*(.+?)(?=\s+precio|\s+stock|$)/i)?.[1]

  const precio_publico =
    normalized.match(/precio\s+p[uú]blico\s*:?\s*\$?\s*([\d.]+)/i)?.[1] ??
    normalized.match(/precio(?:\s+de)?\s*:?\s*\$?\s*([\d.]+)/i)?.[1] ??
    normalized.match(/\$\s*([\d.]+)/)?.[1]

  const precio_compra =
    normalized.match(/precio\s+compra\s*:?\s*\$?\s*([\d.]+)/i)?.[1]

  const precio_mayoreo =
    normalized.match(/precio\s+mayoreo\s*:?\s*\$?\s*([\d.]+)/i)?.[1]

  const stock =
    normalized.match(/stock(?:\s+inicial)?(?:\s+de)?\s*:?\s*(\d+)/i)?.[1] ??
    normalized.match(/(?:un\s+)?stock\s+de\s+(\d+)/i)?.[1] ??
    normalized.match(/(\d+)\s+unidades/i)?.[1]

  if (!codigo || !nombre || !precio_publico || !stock) return null

  const result = {
    nombre: nombre.trim(),
    codigo: Number(codigo),
    precio: Number.parseFloat(precio_publico),
    precio_publico: Number.parseFloat(precio_publico),
    stock: Number(stock),
  }

  if (precio_compra) result.precio_compra = Number.parseFloat(precio_compra)
  if (precio_mayoreo) result.precio_mayoreo = Number.parseFloat(precio_mayoreo)

  return result
}

export function parseVentaArgs(text) {
  if (!text?.trim()) return null
  const normalized = normalizeProductText(text)

  const codigo =
    normalized.match(/c[oó]digo\s*(?:de\s*)?:?\s*(\d+)/i)?.[1] ??
    normalized.match(/\bc[oó]digo\s+(\d+)/i)?.[1]

  const cantidad =
    normalized.match(/(\d+)\s*(?:unidades|pzas|piezas)/i)?.[1] ??
    normalized.match(/vende?\s+(\d+)/i)?.[1] ??
    normalized.match(/vender?\s+(\d+)/i)?.[1] ??
    normalized.match(/cantidad\s*:?\s*(\d+)/i)?.[1]

  if (!codigo || !cantidad) return null

  const tipo_precio = /\bmayoreo\b/i.test(normalized) ? "mayoreo" : "publico"

  return {
    codigo: Number(codigo),
    cantidad: Number(cantidad),
    tipo_precio,
    forma_pago: "01",
  }
}

export function detectProductAction(text) {
  const gestionarArgs = parseGestionarInventarioArgs(text)
  if (gestionarArgs) return "gestionar_inventario"

  const args = parseCreateProductArgs(text)
  if (!args) return null

  const t = text.toLowerCase()
  if (/\b(actualiza|actualizar|modifica|modificar|ajusta|ajustar)\b/.test(t)) {
    return "ajustar_inventario"
  }
  return "crear_producto"
}

export function extractProductFromConversation(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const content = messages[i]?.content || ""
    const args = parseCreateProductArgs(content)
    if (!args) continue
    return {
      tool: detectProductAction(content) || "crear_producto",
      args,
      source: messages[i].role,
    }
  }
  return null
}

export function hasRegistrationIntent(text) {
  return /\b(registrar|registra|crear|dar de alta|agrega|agregar|nuevo producto|producto nuevo|gu[aá]rdalo|gu[aá]rdar|reg[ií]stralo|confirma|hazlo|adelante)\b/i.test(
    text
  )
}

export function detectForcedTool(text) {
  const ventaArgs = parseVentaArgs(text)
  if (ventaArgs) return "registrar_venta"

  const gestionarArgs = parseGestionarInventarioArgs(text)
  if (gestionarArgs) return "gestionar_inventario"

  const productAction = detectProductAction(text)
  if (productAction) return productAction

  const t = text.toLowerCase()

  if (
    hasRegistrationIntent(text) &&
    (/\b(c[oó]digo|precio|stock|nombre)\b/i.test(t) || /\b\d{3,}\b/.test(t))
  ) {
    return parseGestionarInventarioArgs(text) ? "gestionar_inventario" : "crear_producto"
  }

  if (
    /\b(busca|buscar|existencia|cu[aá]nto hay|cu[aá]ntos hay|hay de|stock de)\b/i.test(
      t
    ) ||
    (/\binventario\b/i.test(t) && !hasRegistrationIntent(text)) ||
    /\d+\s*\/\s*\d+/.test(t)
  ) {
    return "buscar_productos"
  }

  if (
    /\b(vende|vender|venta|cobrar|cobro)\b/i.test(t) &&
    (/\b(c[oó]digo|\d{3,})\b/i.test(t) || /\d+\s*(unidades|pzas|piezas)/i.test(t))
  ) {
    return "registrar_venta"
  }

  if (
    /\b(ajusta|ajustar|actualiza|actualizar|modifica|modificar|recib[ií]|entrada|salida)\b/i.test(
      t
    ) &&
    (/\b(c[oó]digo|precio|stock|nombre)\b/i.test(t) || /\b\d{3,}\b/.test(t))
  ) {
    return "ajustar_inventario"
  }

  return null
}

export function parseSearchQuery(text) {
  const cleaned = text
    .replace(
      /^(busca|buscar|encuentra|consulta|revisa|dame|mu[eé]strame|necesito|quiero)\s+(los|las|el|la)?\s*/i,
      ""
    )
    .replace(/\s*(en el inventario|del inventario|disponibles?)\??\s*$/i, "")
    .trim()
  return cleaned || text.trim()
}

export function buildFallbackToolCall(toolName, userText) {
  if (toolName === "registrar_venta") {
    const args = parseVentaArgs(userText)
    if (!args) return null
    return {
      id: `call_force_${Date.now()}`,
      name: toolName,
      arguments: JSON.stringify(args),
    }
  }

  if (toolName === "gestionar_inventario") {
    const args = parseGestionarInventarioArgs(userText)
    if (!args) return null
    return {
      id: `call_force_${Date.now()}`,
      name: toolName,
      arguments: JSON.stringify(args),
    }
  }

  if (toolName === "crear_producto" || toolName === "ajustar_inventario") {
    const args = parseCreateProductArgs(userText)
    if (!args) return null
    return {
      id: `call_force_${Date.now()}`,
      name: toolName,
      arguments: JSON.stringify(args),
    }
  }

  if (toolName === "buscar_productos") {
    return {
      id: `call_force_${Date.now()}`,
      name: toolName,
      arguments: JSON.stringify({ query: parseSearchQuery(userText) }),
    }
  }

  return null
}

export function resolveInventoryUserText(messages) {
  const last = getLastUserMessage(messages)
  if (parseCreateProductArgs(last)) return last

  if (hasRegistrationIntent(last)) {
    for (let i = messages.length - 2; i >= 0; i--) {
      if (parseCreateProductArgs(messages[i]?.content)) {
        return messages[i].content
      }
    }
  }

  return last
}

export { getLastUserMessage }
