"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  canManageTeam,
  getMembershipForUser,
  requireOrgContext,
} from "@/lib/organization/context"

const BASE = "/settings"

function fail(message) {
  redirect(`${BASE}?error=${encodeURIComponent(message)}`)
}

function okTeam(message) {
  redirect(`${BASE}?ok=${encodeURIComponent(message)}`)
}

async function requireTeamManager() {
  const ctx = await requireOrgContext(BASE)
  if (!canManageTeam(ctx.role)) {
    fail("Solo el dueño o administrador puede gestionar el equipo.")
  }
  return ctx
}

export async function inviteTeamMember(formData) {
  try {
    const { supabase, user, organizationId, organization } =
      await requireTeamManager()

    const email = formData.get("email")?.toString().trim().toLowerCase()
    const role = formData.get("role")?.toString() || "cajero"

    if (!email || !email.includes("@")) {
      fail("Correo inválido.")
    }

    if (!["admin", "cajero"].includes(role)) {
      fail("Rol inválido.")
    }

    const { count: memberCount } = await supabase
      .from("organization_members")
      .select("user_id", { count: "exact", head: true })
      .eq("organization_id", organizationId)

    const { count: inviteCount } = await supabase
      .from("organization_invites")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("accepted_at", null)

    const total = (memberCount ?? 0) + (inviteCount ?? 0)
    if (organization?.user_limit && total >= organization.user_limit) {
      fail(
        `Tu plan permite hasta ${organization.user_limit} usuarios. Mejora tu plan en Facturación.`
      )
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email")
      .ilike("email", email)
      .maybeSingle()

    if (profile) {
      const existing = await getMembershipForUser(supabase, profile.id)
      if (existing?.organizationId === organizationId) {
        fail("Ese usuario ya pertenece a tu ferretería.")
      }
      if (existing) {
        fail("Ese usuario ya tiene otra ferretería registrada.")
      }

      const { error } = await supabase.from("organization_members").insert({
        organization_id: organizationId,
        user_id: profile.id,
        role,
      })

      if (error) fail(error.message)
      revalidatePath(BASE)
      okTeam("miembro")
      return
    }

    const { error } = await supabase.from("organization_invites").upsert(
      {
        organization_id: organizationId,
        email,
        role,
        invited_by: user.id,
        accepted_at: null,
      },
      { onConflict: "organization_id,email" }
    )

    if (error) fail(error.message)

    revalidatePath(BASE)
    okTeam("invitacion")
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message ?? "Error al invitar.")
  }
}

export async function removeTeamMember(formData) {
  try {
    const { supabase, user, organizationId } = await requireTeamManager()

    const targetUserId = formData.get("user_id")?.toString()
    if (!targetUserId) fail("Falta el usuario.")
    if (targetUserId === user.id) fail("No puedes quitarte a ti mismo.")

    const { data: target } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", targetUserId)
      .maybeSingle()

    if (!target) fail("Usuario no encontrado en tu equipo.")
    if (target.role === "owner") fail("No se puede quitar al dueño.")

    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("organization_id", organizationId)
      .eq("user_id", targetUserId)

    if (error) fail(error.message)

    revalidatePath(BASE)
    okTeam("removido")
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message ?? "Error al quitar miembro.")
  }
}

export async function cancelTeamInvite(formData) {
  try {
    const { supabase, organizationId } = await requireTeamManager()

    const inviteId = formData.get("invite_id")?.toString()
    if (!inviteId) fail("Falta la invitación.")

    const { error } = await supabase
      .from("organization_invites")
      .delete()
      .eq("id", inviteId)
      .eq("organization_id", organizationId)

    if (error) fail(error.message)

    revalidatePath(BASE)
    okTeam("invitacion_cancelada")
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message ?? "Error al cancelar invitación.")
  }
}
