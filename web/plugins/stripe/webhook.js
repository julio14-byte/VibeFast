import { createAdminClient } from "@/lib/supabase/admin"
import { getStripe } from "./client"
import { getPlanLimits } from "./plans"

async function updateOrganization(orgId, patch) {
  const supabase = createAdminClient()
  const { error } = await supabase.from("organizations").update(patch).eq("id", orgId)

  if (error) {
    console.error("[stripe webhook] update org:", error.message)
    throw error
  }

  if (patch.plan_id) {
    const { data: members } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", orgId)

    const userIds = members?.map((m) => m.user_id) ?? []
    if (userIds.length) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ plan: patch.plan_id })
        .in("id", userIds)

      if (profileError) {
        console.warn("[stripe webhook] profile sync:", profileError.message)
      }
    }
  }
}

function mapSubscriptionStatus(stripeStatus) {
  switch (stripeStatus) {
    case "trialing":
      return "trialing"
    case "active":
      return "active"
    case "past_due":
      return "past_due"
    case "canceled":
      return "canceled"
    case "unpaid":
      return "unpaid"
    case "incomplete":
    case "incomplete_expired":
      return "incomplete"
    default:
      return stripeStatus
  }
}

async function handleCheckoutCompleted(session) {
  const orgId = session.metadata?.organization_id || session.client_reference_id
  if (!orgId) {
    console.warn("[stripe webhook] checkout sin organization_id")
    return
  }

  const planId = session.metadata?.plan_id || "pro"
  const limits = getPlanLimits(planId)

  await updateOrganization(orgId, {
    stripe_customer_id: session.customer,
    stripe_subscription_id: session.subscription,
    plan_id: planId,
    subscription_status: "active",
    product_limit: limits.productLimit,
    user_limit: limits.userLimit,
  })
}

async function handleSubscriptionUpdated(subscription) {
  const orgId = subscription.metadata?.organization_id
  if (!orgId) return

  const planId = subscription.metadata?.plan_id || "pro"
  const limits = getPlanLimits(planId)
  const status = mapSubscriptionStatus(subscription.status)

  const patch = {
    stripe_customer_id: subscription.customer,
    stripe_subscription_id: subscription.id,
    subscription_status: status,
    plan_id: planId,
    product_limit: limits.productLimit,
    user_limit: limits.userLimit,
  }

  if (subscription.trial_end) {
    patch.trial_ends_at = new Date(subscription.trial_end * 1000).toISOString()
  }

  await updateOrganization(orgId, patch)
}

async function handleSubscriptionDeleted(subscription) {
  const orgId = subscription.metadata?.organization_id
  if (!orgId) return

  const starterLimits = getPlanLimits("starter")

  await updateOrganization(orgId, {
    subscription_status: "canceled",
    plan_id: "starter",
    stripe_subscription_id: null,
    product_limit: starterLimits.productLimit,
    user_limit: starterLimits.userLimit,
  })
}

async function handleInvoicePaymentFailed(invoice) {
  const customerId = invoice.customer
  if (!customerId) return

  const supabase = createAdminClient()
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle()

  if (!org) return

  await updateOrganization(org.id, { subscription_status: "past_due" })
}

export async function handleStripeWebhookEvent(event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object)
      break
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object)
      break
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object)
      break
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object)
      break
    default:
      break
  }
}

export function constructStripeEvent(payload, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET no configurado.")
  }

  const stripe = getStripe()
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
