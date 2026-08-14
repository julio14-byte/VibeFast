import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import ProductCsvImport from "@/components/productos/ProductCsvImport"
import PacSandboxForm from "@/components/settings/PacSandboxForm"

export const metadata = { title: "Configuración · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function SettingsPage({ searchParams }) {
  const supabase = await createClient()
  const params = await searchParams

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
      <div>
        <h1 className="page-title">Configuración</h1>
        <p className="page-lead">
          PAC sandbox para timbrado y importación masiva de productos (CSV).
        </p>
      </div>

      {formError && (
        <div role="alert" className="alert alert-error">
          <span>{formError}</span>
        </div>
      )}
      {ok === "pac" && (
        <div role="alert" className="alert alert-success">
          <span>Configuración PAC guardada.</span>
        </div>
      )}
      {ok === "importado" && (
        <div role="alert" className="alert alert-success">
          <span>
            Importación completada: {importCreados ?? 0} creados,{" "}
            {importActualizados ?? 0} actualizados
            {importErrores && Number(importErrores) > 0
              ? `, ${importErrores} filas omitidas`
              : ""}
            .
          </span>
        </div>
      )}

      <PacSandboxForm empresa={empresa} />

      <ProductCsvImport />

      <p className="text-xs text-base-content/55">
        Datos fiscales del emisor y generación de CFDI en{" "}
        <Link href="/facturacion" className="link link-primary">
          Facturación
        </Link>
        .
      </p>
    </div>
  )
}
