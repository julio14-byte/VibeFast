"use client"

import { useCallback, useEffect, useState } from "react"
import { Copy, Check, RefreshCw, Key, Trash2 } from "lucide-react"
import { buildClaudeDesktopMcpConfigJson } from "@/lib/mcp/claudeDesktopConfig"

function buildClaudeConfig(mcpUrl, apiKey) {
  return buildClaudeDesktopMcpConfigJson(mcpUrl, apiKey)
}

export default function McpTokenPanel() {
  const [keys, setKeys] = useState([])
  const [mcpUrl, setMcpUrl] = useState("")
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [creating, setCreating] = useState(false)
  const [jwtLoading, setJwtLoading] = useState(false)
  const [newKeyData, setNewKeyData] = useState(null)
  const [jwtData, setJwtData] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(null)
  const [keyName, setKeyName] = useState("Claude Desktop")

  const loadKeys = useCallback(async () => {
    setLoadingKeys(true)
    try {
      const res = await fetch("/api/mcp/keys", { credentials: "include" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setKeys(data.keys ?? [])
      setMcpUrl(data.mcp_productos_url ?? "")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingKeys(false)
    }
  }, [])

  useEffect(() => {
    loadKeys()
  }, [loadKeys])

  async function createApiKey() {
    setCreating(true)
    setError(null)
    setNewKeyData(null)
    try {
      const res = await fetch("/api/mcp/keys", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNewKeyData(data)
      await loadKeys()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function revokeKey(id) {
    if (!confirm("¿Revocar esta clave? Claude Desktop dejará de conectar.")) return
    setError(null)
    try {
      const res = await fetch(`/api/mcp/keys?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (newKeyData?.id === id) setNewKeyData(null)
      await loadKeys()
    } catch (err) {
      setError(err.message)
    }
  }

  async function fetchJwtToken() {
    setJwtLoading(true)
    setError(null)
    setJwtData(null)
    try {
      const res = await fetch("/api/mcp/token", { credentials: "include" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setJwtData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setJwtLoading(false)
    }
  }

  async function copyText(text, key) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const activeKeyConfig =
    newKeyData &&
    JSON.stringify(newKeyData.claude_desktop_config, null, 2)

  return (
    <section className="rounded-box border border-base-200 bg-base-100 p-4 space-y-6">
      <div>
        <h2 className="font-semibold flex items-center gap-2">
          <Key className="size-5 opacity-70" />
          MCP · Claude Desktop
        </h2>
        <p className="mt-1 text-sm text-base-content/65">
          Conecta Claude a tu inventario. Usa una{" "}
          <strong>API key permanente</strong> (recomendado) o un token corto
          (~1 h).
        </p>
      </div>

      {error && (
        <div role="alert" className="alert alert-error text-sm">
          <span>{error}</span>
        </div>
      )}

      {/* API Key permanente */}
      <div className="space-y-3 rounded-lg border border-primary/25 bg-primary/5 p-4">
        <h3 className="text-sm font-semibold">API key permanente (recomendado)</h3>
        <p className="text-xs text-base-content/60">
          No expira. Formato <code className="text-[10px]">spos_...</code>.
          Requiere <code className="text-[10px]">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
          en el servidor.
        </p>

        <label className="form-control w-full max-w-xs">
          <span className="label-text text-xs">Nombre de la clave</span>
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            className="input input-bordered input-sm"
            placeholder="Claude Desktop"
          />
        </label>

        <button
          type="button"
          onClick={createApiKey}
          disabled={creating}
          className="btn btn-primary btn-sm touch-manipulation min-h-11"
        >
          {creating ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <Key className="size-4" />
          )}
          Crear API key
        </button>

        {newKeyData && (
          <div className="space-y-3 rounded-lg border border-warning/40 bg-warning/10 p-3">
            <p className="text-sm font-medium text-warning-content">
              ⚠️ Copia la clave ahora — no se volverá a mostrar
            </p>
            <code className="block break-all text-xs font-mono bg-base-100 p-2 rounded">
              {newKeyData.api_key}
            </code>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copyText(newKeyData.api_key, "apikey")}
                className="btn btn-outline btn-xs gap-1"
              >
                {copied === "apikey" ? <Check className="size-3" /> : <Copy className="size-3" />}
                Copiar clave
              </button>
              {activeKeyConfig && (
                <button
                  type="button"
                  onClick={() => copyText(activeKeyConfig, "config-new")}
                  className="btn btn-primary btn-xs gap-1"
                >
                  {copied === "config-new" ? <Check className="size-3" /> : <Copy className="size-3" />}
                  Copiar config Claude
                </button>
              )}
            </div>
            {activeKeyConfig && (
              <pre className="max-h-48 overflow-auto rounded border border-base-200 bg-neutral text-neutral-content p-2 text-[10px]">
                {activeKeyConfig}
              </pre>
            )}
          </div>
        )}

        {!loadingKeys && keys.length > 0 && (
          <ul className="divide-y divide-base-200 rounded-lg border border-base-200 text-sm">
            {keys.map((k) => (
              <li
                key={k.id}
                className="flex items-center justify-between gap-2 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{k.name}</p>
                  <p className="text-xs text-base-content/55 font-mono">
                    {k.key_prefix}…
                    {k.last_used_at && (
                      <span className="ml-2 font-sans">
                        · usada{" "}
                        {new Date(k.last_used_at).toLocaleDateString("es-MX")}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => revokeKey(k.id)}
                  className="btn btn-ghost btn-xs btn-square text-error shrink-0"
                  aria-label="Revocar"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* JWT corto */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-base-content/80">
          Token corto (~1 hora) — alternativa
        </summary>
        <div className="mt-3 space-y-3 pl-1">
          <button
            type="button"
            onClick={fetchJwtToken}
            disabled={jwtLoading}
            className="btn btn-outline btn-sm gap-2"
          >
            {jwtLoading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Generar token JWT
          </button>
          {jwtData && (
            <div className="space-y-2">
              <p className="text-xs text-base-content/55">
                Expira{" "}
                {new Date(jwtData.expires_at * 1000).toLocaleString("es-MX")}
              </p>
              <button
                type="button"
                onClick={() =>
                  copyText(
                    buildClaudeConfig(
                      jwtData.mcp_productos_url,
                      jwtData.access_token
                    ),
                    "jwt-config"
                  )
                }
                className="btn btn-outline btn-xs gap-1"
              >
                {copied === "jwt-config" ? <Check className="size-3" /> : <Copy className="size-3" />}
                Copiar config Claude (JWT)
              </button>
            </div>
          )}
        </div>
      </details>

      <ol className="list-decimal list-inside text-sm text-base-content/70 space-y-1 border-t border-base-200 pt-4">
        <li>
          Claude → <strong>Settings → Developer → Edit Config</strong> (activa
          Developer si no lo ves)
        </li>
        <li>Pega el JSON y guarda</li>
        <li>
          Cierra Claude por completo (File → Quit / salir del sistema, no solo
          la ventana)
        </li>
        <li>
          Al abrir de nuevo, busca el icono{" "}
          <strong>🔨 (martillo)</strong> junto al cuadro de chat
        </li>
      </ol>
    </section>
  )
}
