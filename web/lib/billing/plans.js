import config from "@/config"

/** Límites y metadata de planes SaaS (Fase 1). */
export const SAAS_PLAN_LIMITS = {
  starter: { productLimit: 200, userLimit: 1 },
  pro: { productLimit: 5000, userLimit: 3 },
}

export function getPricingPlans() {
  return config.pricing?.plans ?? []
}

export function getPlanConfig(planId) {
  return getPricingPlans().find((p) => p.id === planId) ?? null
}

/**
 * Resuelve el Stripe Price ID: env específico > config.js
 */
export function getStripePriceId(planId) {
  if (planId === "pro") {
    return process.env.STRIPE_PRICE_ID_PRO || getPlanConfig("pro")?.stripePriceId || ""
  }
  return getPlanConfig(planId)?.stripePriceId || ""
}

export function getPlanLimits(planId) {
  return SAAS_PLAN_LIMITS[planId] ?? SAAS_PLAN_LIMITS.starter
}

export const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due"])

export function isSubscriptionActive(organization) {
  if (!organization) return false

  const status = organization.subscription_status
  if (status === "active" || status === "past_due") return true

  if (status === "trialing") {
    if (!organization.trial_ends_at) return true
    return new Date(organization.trial_ends_at) > new Date()
  }

  return false
}

export function subscriptionStatusLabel(status) {
  switch (status) {
    case "active":
      return "Activa"
    case "trialing":
      return "Periodo de prueba"
    case "past_due":
      return "Pago pendiente"
    case "canceled":
      return "Cancelada"
    case "incomplete":
      return "Incompleta"
    case "unpaid":
      return "Impaga"
    default:
      return status ?? "—"
  }
}
