"use client"

import { useState } from "react"
import { Copy, Check, RefreshCw } from "lucide-react"

export default function McpTokenPanel() {
  const [loading, setLoading] = useState(false)
  const [tokenData, setTokenData] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(null)

  async function fetchToken() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/mcp/token", { credentials: "include" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo obtener el token")
      setTokenData(data)
    } catch (err) {
      setError(err.message)
      setTokenData(null)
    } finally {
      setLoading(false)
    }
  }

  function buildClaudeConfig(data) {
    const bearer = `Bearer ${data.access_token}`
    return JSON.stringify(
      {
        mcpServers: {
          "smartpos-productos": {
            command: "npx",
            args: [
              "-y",
              "mcp-remote",
              data.mcp_productos_url,
              "--transport",
              "http-only",
              "--header",
              "Authorization:${SMARTPOS_TOKEN}",
            ],
            env: {
              SMARTPOS_TOKEN: bearer,
            },
          },
        },
      },
      null,
      2
    )
  }

  async function copyText(text, key) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const expiresLabel =
    tokenData?.expires_at &&
    new Date(tokenData.expires_at * 1000).toLocaleString("es-MX")

  return (
    <section className="rounded-box border border-base-200 bg-base-100 p-4 space-y-4">
      <div>
        <h2 className="font-semibold">Token MCP (Claude Desktop)</h2>
        <p className="mt-1 text-sm text-base-content/65">
          Conecta Claude Desktop a tu inventario con Bearer token. El token dura
          ~1 hora; genera uno nuevo cuando expire.
        </p>
      </div>

      <button
        type="button"
        onClick={fetchToken}
        disabled={loading}
        className="btn btn-primary btn-sm touch-manipulation min-h-11"
      >
        {loading ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          <RefreshCw className="size-4" />
        )}
        Generar token MCP
      </button>

      {error && (
        <div role="alert" className="alert alert-error text-sm">
          <span>{error}</span>
        </div>
      )}

      {tokenData && (
        <div className="space-y-4">
          <div className="rounded-lg border border-base-200 bg-base-200/40 p-3 space-y-2">
            <p className="text-xs font-medium text-base-content/60">
              Bearer token (expira {expiresLabel})
            </p>
            <code className="block text-xs break-all font-mono leading-relaxed">
              Bearer {tokenData.access_token.slice(0, 24)}…
            </code>
            <button
              type="button"
              onClick={() =>
                copyText(`Bearer ${tokenData.access_token}`, "token")
              }
              className="btn btn-outline btn-xs gap-1"
            >
              {copied === "token" ? (
                <Check className="size-3" />
              ) : (
                <Copy className="size-3" />
              )}
              Copiar Bearer token
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-base-content/60">
              Config para Claude Desktop (
              <code className="text-[10px]">claude_desktop_config.json</code>)
            </p>
            <pre className="max-h-64 overflow-auto rounded-lg border border-base-200 bg-neutral text-neutral-content p-3 text-[11px] leading-relaxed">
              {buildClaudeConfig(tokenData)}
            </pre>
            <button
              type="button"
              onClick={() => copyText(buildClaudeConfig(tokenData), "config")}
              className="btn btn-outline btn-sm gap-2 touch-manipulation min-h-10"
            >
              {copied === "config" ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              Copiar config Claude Desktop
            </button>
          </div>

          <ol className="list-decimal list-inside text-sm text-base-content/70 space-y-1">
            <li>Pega el JSON en tu config de Claude Desktop</li>
            <li>Cierra Claude por completo y ábrelo de nuevo</li>
            <li>Pregunta: «Busca tornillos en mi inventario SmartPOS»</li>
          </ol>
        </div>
      )}
    </section>
  )
}
