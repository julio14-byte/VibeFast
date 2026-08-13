// ============================================================
// Tools · registry central
// ============================================================

import { crearItem } from "./examples/crearItem.js"
import { buscarItems } from "./examples/buscarItems.js"
import { ajustarInventario } from "./examples/ajustarInventario.js"
import { registrarVenta } from "./examples/registrarVenta.js"
import { enviarEmail } from "./examples/enviarEmail.js"

const registry = new Map()

export function registerTool({ name, description, parameters, execute }) {
  registry.set(name, { name, description, parameters, execute })
}

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

;[
  crearItem,
  buscarItems,
  ajustarInventario,
  registrarVenta,
  enviarEmail,
].forEach(registerTool)
