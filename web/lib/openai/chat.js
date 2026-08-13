// ============================================================
// OpenAI · chat con inventario (ejecución directa + agente)
// ============================================================

import { openai } from "./client"
import { getAiModel } from "./provider"
import config from "@/config"
import { runRecoverDecideAct } from "@/lib/agents/examples/recoverDecideAct.js"
import {
  detectProductAction,
  extractProductFromConversation,
  getLastUserMessage,
  hasRegistrationIntent,
  looksLikeFakeSuccess,
  looksLikeGenericRefusal,
  parseCreateProductArgs,
  parseSearchQuery,
  parseVentaArgs,
  resolveInventoryUserText,
} from "@/lib/agents/intent.js"
import { executeTool } from "@/lib/tools/index.js"

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
  if (producto.proveedor) lines.push(`- Proveedor: ${producto.proveedor}`)
  return lines.join("\n")
}

function formatToolResult(name, result) {
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
          `- Código ${p.codigo}: ${p.descripcion} · Stock ${p.stock} · Público $${p.precio_publico ?? "—"} · Mayoreo $${p.precio_mayoreo ?? "—"}${p.proveedor ? ` · ${p.proveedor}` : ""}`
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

async function runTool(name, args) {
  try {
    return await executeTool(name, args)
  } catch (err) {
    return { ok: false, error: err?.message ?? "Error ejecutando la tool." }
  }
}

async function tryDirectInventoryAction(messages) {
  const lastUser = getLastUserMessage(messages)
  const resolvedText = resolveInventoryUserText(messages)
  const args =
    parseCreateProductArgs(lastUser) ?? parseCreateProductArgs(resolvedText)

  if (args) {
    const tool = detectProductAction(resolvedText) ?? "crear_producto"
    const result = await runTool(tool, args)
    return formatToolResult(tool, result)
  }

  const extracted = extractProductFromConversation(messages)
  if (extracted && (hasRegistrationIntent(lastUser) || extracted.source === "user")) {
    const result = await runTool(extracted.tool, extracted.args)
    return formatToolResult(extracted.tool, result)
  }

  if (/\b(busca|buscar)\b/i.test(lastUser)) {
    const result = await runTool("buscar_productos", {
      query: parseSearchQuery(lastUser),
    })
    return formatToolResult("buscar_productos", result)
  }

  const ventaArgs = parseVentaArgs(lastUser)
  if (ventaArgs) {
    const result = await runTool("registrar_venta", ventaArgs)
    return formatToolResult("registrar_venta", result)
  }

  return null
}

function formatChatEvent(event) {
  switch (event.type) {
    case "token":
      if (looksLikeGenericRefusal(event.text) || looksLikeFakeSuccess(event.text)) {
        return ""
      }
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

function textStream(text, onToken) {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      if (text) {
        if (onToken) onToken(text)
        controller.enqueue(encoder.encode(text))
      }
      controller.close()
    },
  })
}

async function streamChatViaAgent(messages, { onToken, conversationId }) {
  const direct = await tryDirectInventoryAction(messages)
  if (direct) {
    return textStream(direct.trim(), onToken)
  }

  let text = ""
  for await (const event of runRecoverDecideAct({ messages, conversationId })) {
    if (event.type === "error") {
      throw new Error(event.message ?? "Error del agente")
    }
    text += formatChatEvent(event)
  }

  text = text.trim()
  if (looksLikeGenericRefusal(text) || looksLikeFakeSuccess(text)) {
    const retry = await tryDirectInventoryAction(messages)
    text =
      retry?.trim() ||
      'No pude guardar el producto. Prueba: Registra el producto "Llave Stillson 20 pulgadas" con código 2053, precio 110.50 y stock 30.'
  }

  return textStream(text, onToken)
}

export async function streamChat(
  messages,
  { model = config.ai.chatModel, onToken, conversationId, useTools = false } = {}
) {
  if (useTools && config.features.toolUse) {
    return streamChatViaAgent(messages, { onToken, conversationId })
  }

  const completion = await openai.chat.completions.create({
    model: getAiModel(model),
    messages,
    max_tokens: config.ai.maxTokens,
    temperature: config.ai.temperature,
    stream: true,
  })

  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content
          if (!text) continue
          if (onToken) onToken(text)
          controller.enqueue(encoder.encode(text))
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })
}
