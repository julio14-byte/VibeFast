import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

const MEMBER_SELECT = `
  role,
  organization_id,
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

/**
 * Membresía del usuario en su organización (Fase 2: tenant compartido).
 */
export async function getMembershipForUser(supabase, userId) {
  const { data, error } = await supabase
    .from("organization_members")
    .select(MEMBER_SELECT)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[org] getMembershipForUser:", error.message)
    return null
  }

  if (!data?.organization_id) return null

  return {
    organizationId: data.organization_id,
    role: data.role,
    organization: data.organization ?? null,
  }
}

/** organization_id del tenant activo (lanza si no hay membresía). */
export async function requireOrganizationId(supabase, userId) {
  const membership = await getMembershipForUser(supabase, userId)
  if (!membership?.organizationId) {
    throw new Error("Sin organización asignada.")
  }
  return membership.organizationId
}

/** @deprecated Use getMembershipForUser — compat con billing. */
export async function getOrganizationForUser(userId) {
  const supabase = await createClient()
  const membership = await getMembershipForUser(supabase, userId)
  return membership?.organization ?? null
}

export function canManageTeam(role) {
  return role === "owner" || role === "admin"
}

export function roleLabel(role) {
  if (role === "owner") return "Dueño"
  if (role === "admin") return "Administrador"
  if (role === "cajero") return "Cajero"
  return role
}

/**
 * Contexto de servidor: usuario autenticado + organización activa.
 */
export async function requireOrgContext(loginNext = "/dashboard") {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(loginNext)}&error=auth`)
  }

  const membership = await getMembershipForUser(supabase, user.id)
  if (!membership) {
    redirect(`${loginNext}?error=${encodeURIComponent("Sin organización asignada.")}`)
  }

  return {
    supabase,
    user,
    organizationId: membership.organizationId,
    role: membership.role,
    organization: membership.organization,
  }
}
