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
- crear_producto: registrar productos nuevos (nombre, codigo, precio, stock)
- ajustar_inventario: actualizar nombre, precio y stock de un producto existente

Reglas obligatorias:
- Si el usuario pide registrar, crear o dar de alta un producto con datos concretos, DEBES llamar crear_producto. Nunca respondas con un "ejemplo" o instrucciones manuales.
- Si pregunta por stock o busca productos, DEBES llamar buscar_productos.
- Si pide actualizar o ajustar un producto existente (nombre, precio, stock), DEBES llamar ajustar_inventario.
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
