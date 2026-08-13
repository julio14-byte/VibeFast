// Usuario + contraseña (Supabase Auth usa email interno oculto).

const AUTH_DOMAIN =
  process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN || "users.mostrador.app"

export function normalizeUsername(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 32)
}

export function validateUsername(username) {
  const n = normalizeUsername(username)
  if (n.length < 3) {
    return { ok: false, error: "El usuario debe tener al menos 3 caracteres (letras, números, _)." }
  }
  if (n.length > 32) {
    return { ok: false, error: "El usuario no puede superar 32 caracteres." }
  }
  return { ok: true, username: n }
}

export function usernameToAuthEmail(username) {
  const { ok, username: n, error } = validateUsername(username)
  if (!ok) throw new Error(error)
  return `${n}@${AUTH_DOMAIN}`
}
