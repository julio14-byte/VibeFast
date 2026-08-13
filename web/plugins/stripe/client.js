import Stripe from "stripe"

let stripeSingleton = null

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY no configurada.")
  }

  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key)
  }

  return stripeSingleton
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}
