import { NextResponse } from "next/server"
import config from "@/config"
import { getUser } from "@/lib/supabase/server"
import {
  createMcpApiKeyForUser,
  listMcpApiKeysForUser,
  revokeMcpApiKey,
} from "@/lib/mcp/apiKeys"
import { buildClaudeDesktopMcpConfig } from "@/lib/mcp/claudeDesktopConfig"

function appBaseUrl(request) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    config.app.defaultUrl ||
    new URL(request.url).origin
  ).replace(/\/$/, "")
}

function claudeConfigSnippet(mcpUrl, apiKey) {
  return buildClaudeDesktopMcpConfig(mcpUrl, apiKey)
}

/** GET /api/mcp/keys — listar claves activas del usuario */
export async function GET(request) {
  if (!config.features.mcp) {
    return NextResponse.json({ error: "MCP deshabilitado." }, { status: 404 })
  }

  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 })
  }

  const keys = await listMcpApiKeysForUser(user.id)
  const base = appBaseUrl(request)

  return NextResponse.json({
    keys,
    mcp_productos_url: `${base}/api/mcp/productos`,
  })
}

/** POST /api/mcp/keys — crear clave API (se muestra una sola vez) */
export async function POST(request) {
  if (!config.features.mcp) {
    return NextResponse.json({ error: "MCP deshabilitado." }, { status: 404 })
  }

  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 })
  }

  let name = "Claude Desktop"
  try {
    const body = await request.json()
    if (body?.name) name = String(body.name).slice(0, 80)
  } catch {
    // body opcional
  }

  try {
    const created = await createMcpApiKeyForUser(user.id, name)
    const base = appBaseUrl(request)
    const mcpUrl = `${base}/api/mcp/productos`

    return NextResponse.json({
      id: created.id,
      name: created.name,
      key_prefix: created.key_prefix,
      created_at: created.created_at,
      api_key: created.api_key,
      expires_at: null,
      mcp_productos_url: mcpUrl,
      claude_desktop_config: claudeConfigSnippet(mcpUrl, created.api_key),
      warning:
        "Guarda la clave ahora. No se volverá a mostrar completa.",
    })
  } catch (err) {
    return NextResponse.json(
      { error: err?.message ?? "No se pudo crear la clave." },
      { status: 400 }
    )
  }
}

/** DELETE /api/mcp/keys?id=uuid — revocar clave */
export async function DELETE(request) {
  if (!config.features.mcp) {
    return NextResponse.json({ error: "MCP deshabilitado." }, { status: 404 })
  }

  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 })
  }

  const keyId = new URL(request.url).searchParams.get("id")
  if (!keyId) {
    return NextResponse.json({ error: "Falta id de la clave." }, { status: 400 })
  }

  try {
    await revokeMcpApiKey(user.id, keyId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err?.message ?? "No se pudo revocar." },
      { status: 400 }
    )
  }
}
