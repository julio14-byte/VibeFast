import config from "@/config"
import { getStripe } from "./client"
import { getOrganizationForUser } from "./organization"
import { getStripePriceId } from "./plans"

export class StripeCheckoutError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.name = "StripeCheckoutError"
    this.status = status
  }
}

export async function createCheckoutSession({ user, planId = "pro" }) {
  const priceId = getStripePriceId(planId)
  if (!priceId) {
    throw new StripeCheckoutError(
      "Falta STRIPE_PRICE_ID_PRO en .env.local o stripePriceId en config.js.",
      500
    )
  }

  const organization = await getOrganizationForUser(user.id)
  if (!organization) {
    throw new StripeCheckoutError(
      "No se encontró tu negocio. Vuelve a iniciar sesión.",
      400
    )
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || config.app.defaultUrl).replace(
    /\/$/,
    ""
  )

  const stripe = getStripe()

  const sessionParams = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/account/billing?checkout=success`,
    cancel_url: `${appUrl}/account/billing?checkout=cancel`,
    client_reference_id: organization.id,
    metadata: {
      organization_id: organization.id,
      user_id: user.id,
      plan_id: planId,
    },
    subscription_data: {
      metadata: {
        organization_id: organization.id,
        plan_id: planId,
      },
    },
    allow_promotion_codes: true,
  }

  if (organization.stripe_customer_id) {
    sessionParams.customer = organization.stripe_customer_id
  } else if (user.email) {
    sessionParams.customer_email = user.email
  }

  const session = await stripe.checkout.sessions.create(sessionParams)
  return { url: session.url }
}
