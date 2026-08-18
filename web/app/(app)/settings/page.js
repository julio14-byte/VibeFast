import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import PageHeader from "@/components/ui/PageHeader"
import CatalogoNav from "@/components/catalogo/CatalogoNav"
import ProductCsvImport from "@/components/productos/ProductCsvImport"
import PacSandboxForm from "@/components/settings/PacSandboxForm"
import McpTokenPanel from "@/components/settings/McpTokenPanel"
import TeamPanel from "@/components/settings/TeamPanel"
import { canManageMcpInApp } from "@/lib/mcp/adminAccess"
import {
  canManageTeam,
  getMembershipForUser,
} from "@/lib/organization/context"
import config from "@/config"

export const metadata = { title: "Configuración · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function SettingsPage({ searchParams }) {
  const supabase = await createClient()
  const params = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: empresa } = await supabase
    .from("empresa_fiscal")
    .select(
      "pac_provider, pac_mode, pac_sandbox_url, pac_api_key, pac_api_secret"
    )
    .maybeSingle()

  let teamMembers = []
  let teamInvites = []
  let canManage = false
  let userLimit = 1
  let memberCount = 0

  if (user) {
    const membership = await getMembershipForUser(supabase, user.id)
    canManage = canManageTeam(membership?.role)
    userLimit = membership?.organization?.user_limit ?? 1

    if (membership?.organizationId) {
      const { data: members } = await supabase
        .from("organization_members")
        .select("user_id, role, created_at")
        .eq("organization_id", membership.organizationId)
        .order("created_at", { ascending: true })

      const userIds = (members ?? []).map((m) => m.user_id)
      let profilesById = {}

      if (userIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds)

        profilesById = Object.fromEntries(
          (profiles ?? []).map((p) => [p.id, p])
        )
      }

      teamMembers = (members ?? []).map((m) => ({
        ...m,
        profile: profilesById[m.user_id] ?? null,
      }))
      memberCount = teamMembers.length

      if (canManage) {
        const { data: invites } = await supabase
          .from("organization_invites")
          .select("id, email, role, created_at")
          .eq("organization_id", membership.organizationId)
          .is("accepted_at", null)
          .order("created_at", { ascending: false })

        teamInvites = invites ?? []
      }
    }
  }

  const formError = params?.error?.toString()
  const ok = params?.ok?.toString()
  const importCreados = params?.creados?.toString()
  const importActualizados = params?.actualizados?.toString()
  const importErrores = params?.errores?.toString()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Configuración"
        lead="Opciones avanzadas: equipo, importar productos y facturación en prueba."
        tip="Si solo quieres vender, no necesitas tocar esto. Usa Cobrar venta en el menú principal."
      />

      {formError && (
        <div role="alert" className="alert alert-error">
          <span>{formError}</span>
        </div>
      )}
      {ok === "pac" && (
        <div role="alert" className="alert alert-success">
          <span>Ajustes de facturación en prueba guardados.</span>
        </div>
      )}
      {ok === "miembro" && (
        <div role="alert" className="alert alert-success">
          <span>Empleado agregado al equipo.</span>
        </div>
      )}
      {ok === "invitacion" && (
        <div role="alert" className="alert alert-success">
          <span>Invitación registrada. Se unirá al registrarse con ese correo.</span>
        </div>
      )}
      {ok === "removido" && (
        <div role="alert" className="alert alert-success">
          <span>Miembro quitado del equipo.</span>
        </div>
      )}
      {ok === "invitacion_cancelada" && (
        <div role="alert" className="alert alert-success">
          <span>Invitación cancelada.</span>
        </div>
      )}
      {ok === "importado" && (
        <div role="alert" className="alert alert-success">
          <span>
            Lista importada: {importCreados ?? 0} nuevos,{" "}
            {importActualizados ?? 0} actualizados
            {importErrores && Number(importErrores) > 0
              ? `, ${importErrores} filas con error`
              : ""}
            .
          </span>
        </div>
      )}

      <TeamPanel
        members={teamMembers}
        invites={teamInvites}
        canManage={canManage}
        userLimit={userLimit}
        memberCount={memberCount}
      />

      <ProductCsvImport />

      <PacSandboxForm empresa={empresa} />

      {config.features.mcp && canManageMcpInApp(user) ? (
        <McpTokenPanel />
      ) : null}

      <p className="text-sm text-base-content/55">
        Datos de tu negocio para facturas en{" "}
        <Link href="/facturacion" className="link link-primary">
          Facturas
        </Link>
        .
      </p>
    </div>
  )
}
