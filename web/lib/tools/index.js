// ============================================================
// Tools · registry central
// ------------------------------------------------------------
// Un solo registro de herramientas que alimenta dos protocolos:
//   - OpenAI function calling (getOpenAITools)
//   - (Sem 5) servidor MCP, que expondrá este mismo registry
//
// El alumno solo escribe el execute() de cada tool en
// lib/tools/examples/ y la registra aquí. El resto es genérico.
// ============================================================

import { crearItem } from "./examples/crearItem.js"
import { buscarItems } from "./examples/buscarItems.js"
import { ajustarInventario } from "./examples/ajustarInventario.js"
import { enviarEmail } from "./examples/enviarEmail.js"

const registry = new Map()

export function registerTool({ name, description, parameters, execute }) {
  registry.set(name, { name, description, parameters, execute })
}

// Formato que espera OpenAI en el campo `tools` de chat.completions.
export function getOpenAITools() {
  return [...registry.values()].map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }))
}

export async function executeTool(name, args) {
  const tool = registry.get(name)
  if (!tool) throw new Error(`Tool ${name} no registrada`)
  return tool.execute(args)
}

// Auto-registro de los ejemplos incluidos.
;[crearItem, buscarItems, ajustarInventario, enviarEmail].forEach(registerTool)
