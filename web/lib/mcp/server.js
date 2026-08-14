import config from "@/config"
import { getRegisteredTools } from "@/lib/tools/index.js"
import { createMcpServerFromTools } from "./createMcpServer.js"

/**
 * Servidor MCP con el registry completo de tools (agente + email + ventas).
 */
export function getMcpServer() {
  return createMcpServerFromTools(getRegisteredTools(), {
    name: config.app.name,
    version: "1.0.0",
  })
}
