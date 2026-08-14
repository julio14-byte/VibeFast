import { NextResponse } from "next/server"
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import config from "@/config"
import { getUser } from "@/lib/supabase/server"

const MCP_CORS_HEADERS = {
  Allow: "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, mcp-session-id, Last-Event-ID, mcp-protocol-version, Authorization",
}

/**
 * Maneja una petición MCP Streamable HTTP (stateless).
 */
export async function handleMcpHttpRequest(request, getServer) {
  if (!config.features.mcp) {
    return NextResponse.json({ error: "MCP deshabilitado en config.features.mcp." }, { status: 404 })
  }

  const user = await getUser()
  if (!user) {
    return NextResponse.json(
      { error: "Debes iniciar sesión para usar el servidor MCP." },
      { status: 401 }
    )
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  })

  const server = getServer()
  await server.connect(transport)

  return transport.handleRequest(request)
}

export function mcpOptionsResponse() {
  return new Response(null, {
    status: 204,
    headers: MCP_CORS_HEADERS,
  })
}
