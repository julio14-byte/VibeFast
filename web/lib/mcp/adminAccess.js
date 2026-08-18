import config from "@/config"

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase()
}

function adminEmailSet() {
  const fromConfig = (config.mcp?.adminEmails ?? []).map(normalizeEmail)
  const fromFounders = (config.productMetrics?.founderEmails ?? []).map(
    normalizeEmail
  )
  const fromEnv = (process.env.MCP_ADMIN_EMAILS ?? "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean)

  return new Set([...fromConfig, ...fromFounders, ...fromEnv].filter(Boolean))
}

/**
 * ¿Puede este usuario ver/crear claves MCP en la app?
 * Con selfServiceInApp=false (default SaaS), solo admins de plataforma.
 */
export function canManageMcpInApp(user) {
  if (!config.features.mcp) return false

  if (config.mcp?.selfServiceInApp === true) {
    return Boolean(user?.id)
  }

  const email = normalizeEmail(user?.email)
  if (!email) return false

  const admins = adminEmailSet()
  if (admins.size === 0) return false

  return admins.has(email)
}
