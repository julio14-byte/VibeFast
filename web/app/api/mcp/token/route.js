import { NextResponse } from "next/server"
import config from "@/config"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/supabase/server"

function appBaseUrl(request) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    config.app.defaultUrl ||
    new URL(request.url).origin
  )
}

/**
 * GET /api/mcp/token
 * Devuelve el access_token de la sesión actual (requiere login por cookie).
 * Úsalo para Claude Desktop con Authorization: Bearer.
 */
export async function GET(request) {
  if (!config.features.mcp) {
    return NextResponse.json(
      { error: "MCP deshabilitado en config.features.mcp." },
      { status: 404 }
    )
  }

  const user = await getUser()
  if (!user) {
    return NextResponse.json(
      { error: "Inicia sesión en SmartPOS para obtener un token MCP." },
      { status: 401 }
    )
  }

  const supabase = await createClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    return NextResponse.json(
      { error: "No hay sesión activa. Vuelve a iniciar sesión." },
      { status: 401 }
    )
  }

  const base = appBaseUrl(request).replace(/\/$/, "")

  return NextResponse.json({
    access_token: session.access_token,
    expires_at: session.expires_at,
    token_type: "Bearer",
    user_id: user.id,
    email: user.email,
    mcp_productos_url: `${base}/api/mcp/productos`,
    mcp_full_url: `${base}/api/mcp`,
    claude_desktop_hint: {
      command: "npx",
      args: [
        "-y",
        "mcp-remote",
        `${base}/api/mcp/productos`,
        "--transport",
        "http-only",
        "--header",
        "Authorization:${SMARTPOS_TOKEN}",
      ],
      env: { SMARTPOS_TOKEN: "Bearer <access_token>" },
    },
  })
}
