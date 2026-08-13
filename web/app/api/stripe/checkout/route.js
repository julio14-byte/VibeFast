import { NextResponse } from "next/server"
import { getUser } from "@/lib/supabase/server"
import { getStripe, isStripeConfigured } from "@/lib/stripe/client"
import { getOrganizationForUser } from "@/lib/billing/organization"
import { getStripePriceId } from "@/lib/billing/plans"
import config from "@/config"

export async function POST(request) {
  if (!config.features.payments || !isStripeConfigured()) {
    return NextResponse.json(
      { error: "Los pagos no están configurados." },
      { status: 503 }
    )
  }

  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 })
  }

  let planId = "pro"
  try {
    const body = await request.json().catch(() => ({}))
    if (body?.planId) planId = body.planId
  } catch {
    // default pro
  }

  const priceId = getStripePriceId(planId)
  if (!priceId) {
    return NextResponse.json(
      {
        error:
          "Falta STRIPE_PRICE_ID_PRO en .env.local o stripePriceId en config.js.",
      },
      { status: 500 }
    )
  }

  const organization = await getOrganizationForUser(user.id)
  if (!organization) {
    return NextResponse.json(
      { error: "No se encontró tu negocio. Vuelve a iniciar sesión." },
      { status: 400 }
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

  return NextResponse.json({ url: session.url })
}
