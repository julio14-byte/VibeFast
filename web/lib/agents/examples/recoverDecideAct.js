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

const SYSTEM_PROMPT = `Eres un asistente de SmartPOS que puede crear y buscar productos del inventario y enviar emails en nombre del usuario.

Antes de usar una herramienta, explica brevemente tu razonamiento (qué vas a hacer y por qué). Usa las herramientas disponibles cuando la petición lo requiera; si no hace falta ninguna, responde directamente en español. Sé claro y conciso.`

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
