import Link from "next/link"
import ProductCsvImport from "@/components/productos/ProductCsvImport"
import { CSV_COLUMN_GUIDE } from "@/lib/productos/csv"

export default function ImportarProductosPanel() {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
        <h2 className="text-lg font-bold">Importar catálogo desde Excel</h2>
        <p className="mt-1 text-sm text-base-content/65">
          SmartPOS importa archivos <strong>CSV</strong>. En Excel:{" "}
          <strong>Archivo → Guardar como → CSV UTF-8</strong> (delimitado por comas).
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-base-content/70">
          <li>Descarga la plantilla con el botón de abajo.</li>
          <li>Copia tus columnas o renómbralas según la tabla.</li>
          <li>Guarda como CSV y súbelo en Configuración o aquí abajo.</li>
        </ol>
        <div className="mt-4 overflow-x-auto">
          <table className="table table-xs table-zebra">
            <thead>
              <tr>
                <th>Columna</th>
                <th>¿Obligatoria?</th>
                <th>También acepta</th>
              </tr>
            </thead>
            <tbody>
              {CSV_COLUMN_GUIDE.map((row) => (
                <tr key={row.columna}>
                  <td className="font-mono">{row.columna}</td>
                  <td>{row.obligatorio ? "Sí" : "No"}</td>
                  <td className="text-base-content/60">{row.aliases}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-base-content/50">
          ¿Tienes un Excel con otras columnas? Pásanoslo y te ayudamos a mapearlo a
          esta plantilla.
        </p>
      </div>
      <ProductCsvImport returnTo="/negocio" />
      <p className="text-xs text-base-content/50">
        También disponible en{" "}
        <Link href="/settings" className="link link-primary">
          Configuración
        </Link>
        .
      </p>
    </section>
  )
}
