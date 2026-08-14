import config from "@/config"
import { createMcpServerFromTools } from "./createMcpServer.js"
import { getProductosMcpTools } from "./productosTools.js"

/**
 * MCP dedicado a consultas de productos (solo lectura).
 */
export function getProductosMcpServer() {
  return createMcpServerFromTools(getProductosMcpTools(), {
    name: `${config.app.name}-productos`,
    version: "1.0.0",
  })
}
