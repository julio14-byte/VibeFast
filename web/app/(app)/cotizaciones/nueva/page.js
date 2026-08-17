import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import PageHeader from "@/components/ui/PageHeader"
import CotizacionesForm from "@/components/cotizaciones/CotizacionesForm"

export const metadata = { title: "Nueva cotización · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function NuevaCotizacionPage({ searchParams }) {
  const supabase = await createClient()
  const params = await searchParams

  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nombre, razon_social, usa_precio_mayoreo, telefono")
    .order("nombre")

  const formError = params?.error?.toString()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nueva cotización"
        lead="Agrega productos y guarda el presupuesto. Después podrás enviarlo por WhatsApp."
        actions={
          <Link
            href="/cotizaciones"
            className="btn btn-outline btn-sm shrink-0 touch-manipulation min-h-11"
          >
            Volver al listado
          </Link>
        }
      />

      {formError && (
        <div role="alert" className="alert alert-error">
          <span>{formError}</span>
        </div>
      )}

      <CotizacionesForm clientes={clientes ?? []} />
    </div>
  )
}
