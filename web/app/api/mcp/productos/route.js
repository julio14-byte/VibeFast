// ============================================================
// MCP · Consultas de productos (Streamable HTTP)
// ------------------------------------------------------------
// Endpoint: /api/mcp/productos
//
// Herramientas expuestas:
//   - buscar_productos          → búsqueda por nombre o código
//   - obtener_producto_por_codigo → detalle por código exacto
//   - listar_productos          → catálogo con paginación
//   - productos_bajo_stock      → existencias bajas
//
// Requiere sesión Supabase (cookies) del usuario autenticado.
// Activa config.features.mcp.
//
// Ejemplo Cursor (.cursor/mcp.json):
//   { "url": "https://tu-dominio.com/api/mcp/productos" }
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
