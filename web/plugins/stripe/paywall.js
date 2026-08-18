import config from "@/config"
import { getOrganizationForUser } from "./organization"
import { isSubscriptionActive } from "./plans"

/** Rutas accesibles aunque la suscripción no esté activa (navegación y configuración). */
const PAYWALL_EXEMPT_PREFIXES = [
  "/account",
  "/dashboard",
  "/settings",
  "/negocio",
]

function isPaywallExempt(pathname = "") {
  return PAYWALL_EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

/**
 * Devuelve la URL de redirect del paywall o null si el usuario puede continuar.
 */
export async function getPaywallRedirect(userId, pathname = "") {
  if (!config.features.payments) return null
  if (isPaywallExempt(pathname)) return null

  try {
    const organization = await getOrganizationForUser(userId)
    if (organization && !isSubscriptionActive(organization)) {
      return "/account/billing?reason=subscription"
    }
  } catch (err) {
    // No tumbar la app si falta migración 013 o hay error temporal de Supabase.
    console.error("[stripe] paywall check failed:", err?.message)
  }

  return null
}
