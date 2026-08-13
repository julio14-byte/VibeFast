import { NextResponse } from "next/server"
import {
  constructStripeEvent,
  handleStripeWebhookEvent,
  isStripeConfigured,
} from "@/plugins/stripe"

export async function POST(request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe no configurado." }, { status: 503 })
  }

  const payload = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn("[stripe webhook] STRIPE_WEBHOOK_SECRET no configurado.")
    return NextResponse.json({ error: "Webhook no configurado." }, { status: 500 })
  }

  let event

  try {
    event = constructStripeEvent(payload, signature)
  } catch (err) {
    console.error("[stripe webhook] firma inválida:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    await handleStripeWebhookEvent(event)
  } catch (err) {
    console.error("[stripe webhook] handler:", err?.message)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
