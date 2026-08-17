import { AsyncLocalStorage } from "node:async_hooks"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { isSupabaseConfigured } from "./env"

/** Contexto de auth para peticiones MCP (JWT Supabase o API key). */
export const mcpAuthStore = new AsyncLocalStorage()

export function parseBearerToken(request) {
  const auth =
    request.headers.get("authorization") ??
    request.headers.get("Authorization")
  if (!auth?.startsWith("Bearer ")) return null
  const token = auth.slice(7).trim()
  return token || null
}

export function createBearerSupabaseClient(accessToken) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase no configurado.")
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
}

export async function getUserFromBearer(accessToken) {
  if (!accessToken) return null
  try {
    const supabase = createBearerSupabaseClient(accessToken)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken)
    if (error || !user) return null
    return user
  } catch {
    return null
  }
}

export function runWithMcpBearer(accessToken, fn) {
  return mcpAuthStore.run({ accessToken }, fn)
}

/** Contexto para API key spos_... (service role + user_id en tools). */
export function runWithMcpApiKey(apiKeyUser, fn) {
  return mcpAuthStore.run({ apiKeyUser }, fn)
}

export function getMcpAuthStore() {
  return mcpAuthStore.getStore() ?? null
}

export function getMcpBearerToken() {
  return mcpAuthStore.getStore()?.accessToken ?? null
}

export function getMcpApiKeyUser() {
  return mcpAuthStore.getStore()?.apiKeyUser ?? null
}
