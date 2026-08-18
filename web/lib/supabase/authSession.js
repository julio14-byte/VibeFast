const CLOCK_SKEW_WAIT_MS = 2500

export function isJwtClockSkewError(message) {
  if (!message) return false
  const m = String(message).toLowerCase()
  return (
    m.includes("issued at future") ||
    m.includes("token-not-active-yet") ||
    m.includes("clock skew") ||
    m.includes("not yet valid")
  )
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Obtiene usuario con reintentos si hay desfase de reloj (JWT iat en el futuro).
 * Común en VMs, Vercel o PCs con hora mal sincronizada.
 */
export async function getAuthenticatedUser(supabase) {
  let {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (user && !error) {
    return { user, error: null }
  }

  const message = error?.message ?? ""

  if (isJwtClockSkewError(message)) {
    await sleep(CLOCK_SKEW_WAIT_MS)

    const retry = await supabase.auth.getUser()
    user = retry.data.user
    error = retry.error

    if (user && !error) {
      return { user, error: null }
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (session?.refresh_token) {
      await supabase.auth.refreshSession({
        refresh_token: session.refresh_token,
      })

      const afterRefresh = await supabase.auth.getUser()
      user = afterRefresh.data.user
      error = afterRefresh.error

      if (user && !error) {
        return { user, error: null }
      }
    }
  }

  return {
    user: user ?? null,
    error: error?.message ?? message ?? null,
  }
}

export function clockSkewUserMessage() {
  return (
    "La sesión no pudo validarse por desfase de reloj (JWT issued at future). " +
    "Sincroniza la hora de tu dispositivo, cierra sesión y vuelve a entrar."
  )
}
