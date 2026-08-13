import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"

/**
 * Conecta un cliente MCP a un servidor Streamable HTTP (ej. /api/mcp).
 *
 * @param {string} url - URL absoluta del endpoint MCP.
 * @param {{ requestInit?: RequestInit }} [options]
 */
export async function createMcpClient(url, options = {}) {
  const transport = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: options.requestInit,
  })

  const client = new Client({
    name: "vibefast-mcp-client",
    version: "1.0.0",
  })

  await client.connect(transport)
  return client
}
