import config from "@/config"

/** ¿Hay algún método de acceso habilitado? */
export function isAuthEnabled() {
  return (
    config.features.googleAuth ||
    config.features.emailLogin ||
    config.features.usernameLogin
  )
}

/** URL principal para entrar a la app desde la landing. */
export function getAppEntryUrl() {
  return config.auth.entryUrl ?? config.auth.afterLoginUrl ?? "/dashboard"
}
