import { createClient } from "@/lib/supabase/server"

/**
 * Organización principal del usuario (Fase 1: un negocio por usuario).
 */
export async function getOrganizationForUser(userId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("organization_members")
    .select(
      `
      role,
      organization:organizations (
        id,
        name,
        slug,
        plan_id,
        stripe_customer_id,
        stripe_subscription_id,
        subscription_status,
        trial_ends_at,
        product_limit,
        user_limit,
        created_at
      )
    `
    )
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[stripe] getOrganizationForUser:", error.message)
    return null
  }
  return data?.organization ?? null
}
