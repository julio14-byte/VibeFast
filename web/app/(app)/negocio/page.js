import Link from "next/link"
import { createClient, getUser } from "@/lib/supabase/server"
import PageHeader from "@/components/ui/PageHeader"
import NegocioForm from "@/components/negocio/NegocioForm"
import TicketPreview from "@/components/negocio/TicketPreview"
import ImportarProductosPanel from "@/components/negocio/ImportarProductosPanel"
import {
  empresaConfigurada,
  getEmpresaForOrganization,
} from "@/lib/negocio/empresa"
import { getMembershipForUser } from "@/lib/organization/context"

export const metadata = { title: "Mi negocio · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function NegocioPage({ searchParams }) {
  const supabase = await createClient()
  const user = await getUser()
  const params = await searchParams

  let empresa = null
  let organizationName = "Mi ferretería"

  if (user) {
    const membership = await getMembershipForUser(supabase, user.id)
    organizationName = membership?.organization?.name ?? organizationName
    if (membership?.organizationId) {
      empresa = await getEmpresaForOrganization(
        supabase,
        membership.organizationId
      )
    }
  }

  const formError = params?.error?.toString()
  const ok = params?.ok?.toString()
  const importCreados = params?.creados?.toString()
  const importActualizados = params?.actualizados?.toString()
  const importErrores = params?.errores?.toString()
  const configurado = empresaConfigurada(empresa)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Mi negocio"
        lead="Datos de tu ferretería para facturas electrónicas, ventas y tickets de mostrador."
        tip="Configura esto una vez al abrir la tienda. Los tickets usan el nombre comercial y el texto que elijas abajo."
        actions={
          <>
            <Link
              href="/facturacion"
              className="btn btn-outline btn-sm touch-manipulation min-h-10"
            >
              Facturas
            </Link>
            <Link
              href="/ventas"
              className="btn btn-outline btn-sm touch-manipulation min-h-10"
            >
              Cobrar venta
            </Link>
          </>
        }
      />

      {formError && (
        <div role="alert" className="alert alert-error">
          <span>{formError}</span>
        </div>
      )}
      {ok === "guardado" && (
        <div role="alert" className="alert alert-success">
          <span>Datos del negocio guardados. Facturas y tickets ya los usan.</span>
        </div>
      )}
      {ok === "importado" && (
        <div role="alert" className="alert alert-success">
          <span>
            Importación lista: {importCreados ?? 0} creados,{" "}
            {importActualizados ?? 0} actualizados
            {importErrores && Number(importErrores) > 0
              ? `, ${importErrores} filas con error`
              : ""}
            .
          </span>
        </div>
      )}

      {!configurado && (
        <div role="alert" className="alert alert-warning">
          <span>
            Completa RFC, razón social y código postal para poder facturar. El
            ticket puede usar el nombre comercial aunque falten datos fiscales.
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <NegocioForm empresa={empresa} organizationName={organizationName} />
        <aside className="space-y-3">
          <h2 className="text-sm font-semibold text-base-content/70">
            Vista previa del ticket
          </h2>
          <TicketPreview empresa={empresa} />
          <p className="text-xs text-base-content/50">
            Así se verá al cobrar en{" "}
            <Link href="/ventas" className="link link-primary">
              Cobrar venta
            </Link>
            . Marca «Imprimir ticket (80mm) al cobrar».
          </p>
        </aside>
      </div>

      <ImportarProductosPanel />
    </div>
  )
}
