import crypto from "node:crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export const MCP_API_KEY_PREFIX = "spos_"
const MAX_KEYS_PER_USER = 5

export function hashMcpApiKey(rawKey) {
  return crypto.createHash("sha256").update(rawKey).digest("hex")
}

export function generateMcpApiKey() {
  const secret = crypto.randomBytes(32).toString("base64url")
  const rawKey = `${MCP_API_KEY_PREFIX}${secret}`
  const key_prefix = rawKey.slice(0, 16)
  return { rawKey, key_prefix, key_hash: hashMcpApiKey(rawKey) }
}

export function isMcpApiKey(token) {
  return Boolean(token?.startsWith(MCP_API_KEY_PREFIX))
}

/**
 * Valida clave API (servidor MCP). Usa service_role.
 * @returns {{ id, user_id, email, name } | null}
 */
export async function validateMcpApiKey(rawKey) {
  if (!isMcpApiKey(rawKey)) return null

  let admin
  try {
    admin = createAdminClient()
  } catch {
    return null
  }

  const key_hash = hashMcpApiKey(rawKey)

  const { data: row, error } = await admin
    .from("mcp_api_keys")
    .select("id, user_id, name, expires_at, revoked_at")
    .eq("key_hash", key_hash)
    .maybeSingle()

  if (error || !row || row.revoked_at) return null

  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return null
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", row.user_id)
    .maybeSingle()

  return {
    id: row.id,
    user_id: row.user_id,
    email: profile?.email ?? null,
    name: row.name,
  }
}

export async function touchMcpApiKey(keyId) {
  try {
    const admin = createAdminClient()
    await admin
      .from("mcp_api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", keyId)
  } catch {
    // best-effort
  }
}

export async function listMcpApiKeysForUser(userId) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("mcp_api_keys")
    .select("id, name, key_prefix, last_used_at, expires_at, created_at, revoked_at")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createMcpApiKeyForUser(userId, name = "Claude Desktop") {
  const supabase = await createClient()

  const { count } = await supabase
    .from("mcp_api_keys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("revoked_at", null)

  if ((count ?? 0) >= MAX_KEYS_PER_USER) {
    throw new Error(`Máximo ${MAX_KEYS_PER_USER} claves activas. Revoca una antes de crear otra.`)
  }

  const { rawKey, key_prefix, key_hash } = generateMcpApiKey()

  const { data, error } = await supabase
    .from("mcp_api_keys")
    .insert({
      user_id: userId,
      name: name.trim() || "Claude Desktop",
      key_prefix,
      key_hash,
      expires_at: null,
    })
    .select("id, name, key_prefix, created_at")
    .single()

  if (error) throw new Error(error.message)

  return { ...data, api_key: rawKey }
}

export async function revokeMcpApiKey(userId, keyId) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("mcp_api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("user_id", userId)

  if (error) throw new Error(error.message)
}
