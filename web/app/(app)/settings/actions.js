"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireOrgContext } from "@/lib/organization/context"

const BASE = "/settings"

async function requireUser() {
  return requireOrgContext(BASE)
}

function fail(message) {
  redirect(`${BASE}?error=${encodeURIComponent(message)}`)
}

export async function guardarPacConfig(formData) {
  try {
    const { supabase, organizationId } = await requireUser()

    const data = {
      pac_provider: formData.get("pac_provider")?.toString() || "sandbox",
      pac_mode: formData.get("pac_mode")?.toString() || "sandbox",
      pac_sandbox_url:
        formData.get("pac_sandbox_url")?.toString().trim() ||
        "https://sandbox.facturama.mx",
      pac_api_key: formData.get("pac_api_key")?.toString().trim() || null,
      pac_api_secret: formData.get("pac_api_secret")?.toString().trim() || null,
    }

    const { data: existing } = await supabase
      .from("empresa_fiscal")
      .select("id")
      .eq("organization_id", organizationId)
      .maybeSingle()

    if (!existing) {
      fail(
        "Configura primero los datos fiscales del emisor en Facturación."
      )
    }

    const { error } = await supabase
      .from("empresa_fiscal")
      .update(data)
      .eq("organization_id", organizationId)

    if (error) fail(error.message)

    revalidatePath(BASE)
    revalidatePath("/facturacion")
    redirect(`${BASE}?ok=pac`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message)
  }
}
