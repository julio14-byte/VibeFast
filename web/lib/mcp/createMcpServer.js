import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import config from "@/config"
import { jsonSchemaToZodShape } from "./schema.js"

function formatToolResult(result) {
  if (result?.mensaje) return result.mensaje
  return JSON.stringify(result, null, 2)
}

/**
 * Crea un servidor MCP stateless con un conjunto de herramientas.
 */
export function createMcpServerFromTools(
  tools,
  { name = config.app.name, version = "1.0.0" } = {}
) {
  const server = new McpServer({ name, version })

  for (const tool of tools) {
    const inputSchema = jsonSchemaToZodShape(tool.parameters)

    server.registerTool(
      tool.name,
      {
        title: tool.title ?? tool.name,
        description: tool.description,
        inputSchema,
      },
      async (args) => {
        try {
          const result = await tool.execute(args)
          const text = formatToolResult(result)
          return {
            content: [{ type: "text", text }],
            structuredContent: result,
          }
        } catch (err) {
          const message = err?.message ?? "Error ejecutando la herramienta."
          return {
            isError: true,
            content: [{ type: "text", text: message }],
          }
        }
      }
    )
  }

  return server
}
