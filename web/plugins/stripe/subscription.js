import { getOrganizationForUser } from "./organization"
import { isSubscriptionActive } from "./plans"

/**
 * Indica si el usuario tiene suscripción activa (trial o plan pagado).
 */
export async function hasActiveSubscription(userId) {
  const organization = await getOrganizationForUser(userId)
  return isSubscriptionActive(organization)
}
