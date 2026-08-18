import ProductCsvImport from "@/components/productos/ProductCsvImport"
import VaciarCatalogoPanel from "@/components/productos/VaciarCatalogoPanel"

export default function ImportarProductosPanel() {
  return (
    <section className="space-y-4">
      <ProductCsvImport returnTo="/negocio" />
      <VaciarCatalogoPanel returnTo="/negocio" />
    </section>
  )
}
