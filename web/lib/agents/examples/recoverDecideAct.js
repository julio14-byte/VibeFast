// ============================================================
// Agente de ejemplo · recover → decide → act
// ------------------------------------------------------------
// Instancia concreta del wrapper genérico (../graph.js) con:
//   - las 3 tools del registry (crear_item, buscar_items, enviar_email)
//   - un system prompt en español
//   - auditoría best-effort de cada tool call vía logToolCall
//
// El Route Handler importa runRecoverDecideAct() y streamea sus
// eventos como SSE.
// ============================================================

import { getOpenAITools, executeTool } from "@/lib/tools/index.js"
import { runAgent } from "@/lib/agents/graph.js"

const SYSTEM_PROMPT = `Eres el asistente de SmartPOS (ferretería) con acceso REAL al inventario del usuario autenticado.

Herramientas disponibles:
- buscar_productos: consultar existencias
- gestionar_inventario: dar de alta o actualizar producto (nombre, codigo, precio, stock) — preferida para inventario
- crear_producto: registrar productos nuevos con precios múltiples y proveedor
- ajustar_inventario: actualizar nombre, precio y stock de un producto existente por código

Reglas obligatorias:
- Si el usuario da nombre, código, precio y stock, DEBES llamar gestionar_inventario (crea o actualiza según el código).
- Si pregunta por stock o busca productos, DEBES llamar buscar_productos.
- Si pide actualizar solo algunos campos de un producto existente, usa ajustar_inventario.
- Si necesita proveedor o precios de compra/mayoreo al crear, usa crear_producto.
- NUNCA digas "ingresa estos datos en el sistema" ni des pasos genéricos: tú ejecutas las acciones con tus herramientas.

Antes de usar una herramienta, explica brevemente qué vas a hacer. Responde en español, claro y conciso.`

// Registra cada tool call en la bitácora de auditoría (Session A).
// El import es dinámico y tolerante a fallos: si web/lib/audit.js
// aún no está mergeado, el agente sigue funcionando sin auditar.
async function logToolCall(entry) {
  try {
    const mod = await import("@/lib/audit.js")
    await mod.logToolCall?.(entry)
  } catch {
    // audit.js (Session A) no disponible todavía: best-effort.
  }
}

// messages: [{ role, content }] · conversationId?: string
// Devuelve el async generator de eventos del agente.
export function runRecoverDecideAct({ messages, conversationId }) {
  return runAgent({
    messages,
    conversationId,
    systemPrompt: SYSTEM_PROMPT,
    tools: getOpenAITools(),
    executeTool,
    onToolCall: logToolCall,
  })
}
