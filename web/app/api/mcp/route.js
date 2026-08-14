// ============================================================
// MCP · Streamable HTTP (stateless) — registry completo
// ------------------------------------------------------------
// Expone todas las tools de web/lib/tools vía Model Context Protocol.
// Para solo consultas de productos usa /api/mcp/productos
// ============================================================

import { getMcpServer } from "@/lib/mcp/server"
import { handleMcpHttpRequest, mcpOptionsResponse } from "@/lib/mcp/handler"

export async function GET(request) {
  return handleMcpHttpRequest(request, getMcpServer)
}

export async function POST(request) {
  return handleMcpHttpRequest(request, getMcpServer)
}

export async function DELETE(request) {
  return handleMcpHttpRequest(request, getMcpServer)
}

export async function OPTIONS() {
  return mcpOptionsResponse()
}
