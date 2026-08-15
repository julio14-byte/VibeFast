/** Metadata del plugin Stripe (suscripciones SaaS). */
const stripePlugin = {
  id: "stripe",
  name: "Stripe Subscriptions",
  description:
    "Checkout, portal de cliente, webhook y paywall para planes mensuales vía Stripe.",
  featureKey: "payments",
  migration: "013_saas_organizations.sql",
  envVars: [
    "STRIPE_SECRET_KEY",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_ID_PRO",
    "SUPABASE_SERVICE_ROLE_KEY",
  ],
  routes: {
    checkout: "/api/stripe/checkout",
    portal: "/api/stripe/portal",
    webhook: "/api/webhooks/stripe",
    billing: "/account/billing",
  },
  docs: "/docs/instalacion/stripe",
}

export default stripePlugin
