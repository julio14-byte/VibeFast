// ============================================================
// MCP · Streamable HTTP (stateless) — registry completo
// ------------------------------------------------------------
// Expone todas las tools de web/lib/tools vía Model Context Protocol.
// Solo lectura de productos: /api/mcp/productos
//
// Autenticación (cualquiera de estas):
//   1. Cookie de sesión Supabase (navegador logueado)
//   2. Authorization: Bearer <JWT> — GET /api/mcp/token (~1 h)
//   3. Authorization: Bearer spos_... — API key permanente
//      Crear en Configuración → MCP; requiere SUPABASE_SERVICE_ROLE_KEY
//
// Claude Desktop: claude_desktop_config.json + npx mcp-remote@latest
//   (NO usar Conectores web de Claude — no envían Bearer sin OAuth)
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
