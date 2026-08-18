// ============================================================
// MCP · Consultas de productos (Streamable HTTP)
// ------------------------------------------------------------
// Endpoint: /api/mcp/productos
//
// Herramientas: buscar_productos, obtener_producto_por_codigo,
// listar_productos, productos_bajo_stock
//
// Autenticación (una de estas):
//   • Cookie — usuario logueado en el navegador
//   • Bearer JWT — GET /api/mcp/token (expira ~1 h)
//   • Bearer spos_... — API key en Configuración → MCP (permanente)
//
// Claude Desktop (recomendado):
//   Settings → Developer → Edit Config → mcp-remote + header Authorization
//   Copiar JSON desde Configuración → Crear API key → Copiar config Claude
// ============================================================

import { getProductosMcpServer } from "@/lib/mcp/productosServer"
import { handleMcpHttpRequest, mcpOptionsResponse } from "@/lib/mcp/handler"

export async function GET(request) {
  return handleMcpHttpRequest(request, getProductosMcpServer)
}

export async function POST(request) {
  return handleMcpHttpRequest(request, getProductosMcpServer)
}

export async function DELETE(request) {
  return handleMcpHttpRequest(request, getProductosMcpServer)
}

export async function OPTIONS() {
  return mcpOptionsResponse()
}
