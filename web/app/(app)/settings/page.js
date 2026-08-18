import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import PageHeader from "@/components/ui/PageHeader"
import CatalogoNav from "@/components/catalogo/CatalogoNav"
import ProductCsvImport from "@/components/productos/ProductCsvImport"
import PacSandboxForm from "@/components/settings/PacSandboxForm"
import McpTokenPanel from "@/components/settings/McpTokenPanel"
import { canManageMcpInApp } from "@/lib/mcp/adminAccess"
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

  const formError = params?.error?.toString()
  const ok = params?.ok?.toString()
  const importCreados = params?.creados?.toString()
  const importActualizados = params?.actualizados?.toString()
  const importErrores = params?.errores?.toString()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Configuración"
        lead="Opciones avanzadas: importar tu lista de productos y modo de prueba para facturas electrónicas."
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
