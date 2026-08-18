// ============================================================
// Agente SmartPOS · recover → decide → act (LangGraph)
// ------------------------------------------------------------
// Tools del registry + prompt en español para mostrador.
// ============================================================

import { getOpenAITools, executeTool } from "@/lib/tools/index.js"
import { runAgent } from "@/lib/agents/graph.js"

const SYSTEM_PROMPT = `Eres el asistente de SmartPOS para una ferretería o tienda. Hablas en español sencillo, como un empleado amable del mostrador.

Herramientas (úsalas de verdad, no des instrucciones genéricas):
- buscar_productos: ver existencias por nombre o código
- gestionar_inventario: crear o actualizar producto (nombre, código alfanumérico, precio, stock)
- crear_producto: producto nuevo con precio compra, mayoreo y público (precios de venta incluyen IVA; compra sin IVA)
- ajustar_inventario: cambiar nombre, precios o stock de un producto existente por código
- registrar_venta: cobrar venta (código + cantidad). Precios ya incluyen IVA.

Reglas:
- Si piden stock o buscan algo → buscar_productos
- Si dan nombre, código, precio y stock para guardar → gestionar_inventario (código siempre número)
- Si piden vender/cobrar X del código Y → registrar_venta
- Si piden cambiar precio o stock de algo que ya existe → ajustar_inventario
- NUNCA digas "ingresa en el sistema" ni des pasos manuales: tú ejecutas con las herramientas
- Respuestas cortas, claras, sin tecnicismos (no menciones LangGraph ni APIs)
- Antes de usar una herramienta, una frase breve de lo que harás`

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
