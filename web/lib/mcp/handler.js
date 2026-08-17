import { NextResponse } from "next/server"
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import config from "@/config"
import { getUser } from "@/lib/supabase/server"
import {
  getUserFromBearer,
  parseBearerToken,
  runWithMcpBearer,
} from "@/lib/supabase/requestContext"

const MCP_CORS_HEADERS = {
  Allow: "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, mcp-session-id, Last-Event-ID, mcp-protocol-version, Authorization",
}

/**
 * Maneja una petición MCP Streamable HTTP (stateless).
 * Auth: cookie de sesión (navegador) o Authorization: Bearer <access_token>.
 */
export async function handleMcpHttpRequest(request, getServer) {
  if (!config.features.mcp) {
    return NextResponse.json(
      { error: "MCP deshabilitado en config.features.mcp." },
      { status: 404 }
    )
  }

  const bearer = parseBearerToken(request)
  const user = bearer
    ? await getUserFromBearer(bearer)
    : await getUser()

  if (!user) {
    return NextResponse.json(
      {
        error: bearer
          ? "Token Bearer inválido o expirado."
          : "Debes iniciar sesión o enviar Authorization: Bearer <token>.",
      },
      { status: 401 }
    )
  }

  const runTransport = async () => {
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    })

    const server = getServer()
    await server.connect(transport)

    return transport.handleRequest(request)
  }

  if (bearer) {
    return runWithMcpBearer(bearer, runTransport)
  }

  return runTransport()
}

export function mcpOptionsResponse() {
  return new Response(null, {
    status: 204,
    headers: MCP_CORS_HEADERS,
  })
}
