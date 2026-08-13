import config from "@/config"
import { getOrganizationForUser } from "./organization"
import { isSubscriptionActive } from "./plans"

/**
 * Devuelve la URL de redirect del paywall o null si el usuario puede continuar.
 */
export async function getPaywallRedirect(userId, pathname = "") {
  if (!config.features.payments) return null

  const isAccountRoute = pathname.startsWith("/account")
  if (isAccountRoute) return null

  const organization = await getOrganizationForUser(userId)
  if (organization && !isSubscriptionActive(organization)) {
    return "/account/billing?reason=subscription"
  }

  return null
}
