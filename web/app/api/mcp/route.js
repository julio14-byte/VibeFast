// ============================================================
// MCP · Streamable HTTP (stateless)
// ------------------------------------------------------------
// Expone el registry de web/lib/tools vía Model Context Protocol.
// Requiere sesión Supabase (cookies) del usuario autenticado.
// ============================================================

import { NextResponse } from "next/server"
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import config from "@/config"
import { getUser } from "@/lib/supabase/server"
import { getMcpServer } from "@/lib/mcp/server"

async function handleMcpRequest(request) {
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

  const server = getMcpServer()
  await server.connect(transport)

  return transport.handleRequest(request)
}

export async function GET(request) {
  return handleMcpRequest(request)
}

export async function POST(request) {
  return handleMcpRequest(request)
}

export async function DELETE(request) {
  return handleMcpRequest(request)
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, mcp-session-id, Last-Event-ID, mcp-protocol-version, Authorization",
    },
  })
}
