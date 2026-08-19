import { createClient } from "@/lib/supabase/server"
import { requireOrganizationId } from "@/lib/organization/context"

/** Usuario autenticado + organization_id para herramientas del chat/agente. */
export async function requireToolOrgContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("No autenticado")

  const organizationId = await requireOrganizationId(supabase, user.id)
  return { supabase, user, organizationId }
}
