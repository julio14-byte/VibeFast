import { NextResponse } from "next/server"
import { getUser } from "@/lib/supabase/server"
import { getStripe, isStripeConfigured } from "@/lib/stripe/client"
import { getOrganizationForUser } from "@/lib/billing/organization"
import config from "@/config"

export async function POST() {
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

  const organization = await getOrganizationForUser(user.id)
  if (!organization?.stripe_customer_id) {
    return NextResponse.json(
      { error: "Aún no tienes una suscripción activa en Stripe." },
      { status: 400 }
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

  return NextResponse.json({ url: portal.url })
}
