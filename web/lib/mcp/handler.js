import { NextResponse } from "next/server"
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import config from "@/config"
import { getUser } from "@/lib/supabase/server"
import {
  getUserFromBearer,
  parseBearerToken,
  runWithMcpApiKey,
  runWithMcpBearer,
} from "@/lib/supabase/requestContext"
import {
  isMcpApiKey,
  touchMcpApiKey,
  validateMcpApiKey,
} from "@/lib/mcp/apiKeys"

const MCP_CORS_HEADERS = {
  Allow: "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, mcp-session-id, Last-Event-ID, mcp-protocol-version, Authorization",
}

/**
 * Maneja una petición MCP Streamable HTTP (stateless).
 * Auth: cookie, Bearer JWT Supabase, o Bearer API key spos_...
 */
export async function handleMcpHttpRequest(request, getServer) {
  if (!config.features.mcp) {
    return NextResponse.json(
      { error: "MCP deshabilitado en config.features.mcp." },
      { status: 404 }
    )
  }

  const bearer = parseBearerToken(request)
  let user = null
  let authMode = "cookie"

  if (bearer && isMcpApiKey(bearer)) {
    const keyRow = await validateMcpApiKey(bearer)
    if (keyRow) {
      user = { id: keyRow.user_id, email: keyRow.email }
      authMode = "apiKey"
      await touchMcpApiKey(keyRow.id)
    }
  } else if (bearer) {
    user = await getUserFromBearer(bearer)
    authMode = "jwt"
  } else {
    user = await getUser()
  }

  if (!user) {
    return NextResponse.json(
      {
        error: bearer
          ? isMcpApiKey(bearer)
            ? "API key inválida, revocada o expirada."
            : "Token Bearer inválido o expirado."
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

  if (authMode === "apiKey") {
    return runWithMcpApiKey({ id: user.id, email: user.email }, runTransport)
  }

  if (authMode === "jwt" && bearer) {
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
