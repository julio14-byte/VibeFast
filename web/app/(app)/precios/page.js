import PageHeader from "@/components/ui/PageHeader"
import CatalogoNav from "@/components/catalogo/CatalogoNav"
import ConsultaPreciosClient from "@/components/precios/ConsultaPreciosClient"

export const metadata = { title: "Consulta de precios · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function PreciosPage({ searchParams }) {
  const params = await searchParams
  const ok = params?.ok?.toString()

  return (
    <div className="space-y-6 pb-safe-nav-bar lg:pb-0">
      <PageHeader
        title="Consulta de precios"
        lead="Busca un producto y revisa menudeo, mayoreo y costo. Ideal en mostrador o cuando llega mercancía."
        tip="Para agregar productos nuevos o importar una lista, usa Administrar catálogo."
      />

      {ok === "actualizado" && (
        <div role="alert" className="alert alert-success">
          <span>Precios actualizados.</span>
        </div>
      )}

      <CatalogoNav />

      <ConsultaPreciosClient />
    </div>
  )
}