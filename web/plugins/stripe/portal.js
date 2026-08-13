import config from "@/config"
import { getStripe } from "./client"
import { getOrganizationForUser } from "./organization"

export class StripePortalError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.name = "StripePortalError"
    this.status = status
  }
}

export async function createPortalSession(user) {
  const organization = await getOrganizationForUser(user.id)
  if (!organization?.stripe_customer_id) {
    throw new StripePortalError(
      "Aún no tienes una suscripción activa en Stripe.",
      400
    )
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || config.app.defaultUrl).replace(
    /\/$/,
    ""
  )

  const stripe = getStripe()
  const portal = await stripe.billingPortal.sessions.create({
    customer: organization.stripe_customer_id,
    return_url: `${appUrl}/account/billing`,
  })

  return { url: portal.url }
}
