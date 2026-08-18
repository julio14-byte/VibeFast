"use client"

import { useState } from "react"
import { FileUp, Download } from "lucide-react"
import { CSV_TEMPLATE } from "@/lib/productos/csv"
import { importProductosCsv } from "@/app/(app)/productos/actions"

export default function ProductCsvImport({ returnTo = "/settings" }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "plantilla-productos.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      const result = await importProductosCsv(formData)
      if (!result?.ok) {
        setError(result?.error ?? "No se pudo importar el archivo.")
        setLoading(false)
        return
      }
      form.reset()
      const base = returnTo.split("?")[0]
      window.location.href = `${base}?ok=importado&creados=${result.creados}&actualizados=${result.actualizados}&errores=${result.errores}`
    } catch (err) {
      setError(err?.message ?? "Error al importar.")
      setLoading(false)
    }
  }

  return (
    <section
      className="rounded-box border border-base-200 bg-base-100 p-4"
      aria-label="Importar productos CSV"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold">Importación masiva (CSV)</h2>
          <p className="mt-1 text-xs text-base-content/60">
            Columnas: nombre, codigo, precio_publico, stock (mínimo). Opcional:
            precio_compra (sin IVA), precio_mayoreo (con IVA), margen_ganancia,
            margen_mayoreo,
            clave_sat, unidad_sat. Precios de venta incluyen IVA.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <a
            href="/samples/inventas_4934_smartpos.csv"
            download="inventas_4934_smartpos.csv"
            className="btn btn-outline btn-sm gap-2 touch-manipulation"
          >
            <Download className="size-4" />
            Tu catálogo (9.849)
          </a>
          <button
            type="button"
            onClick={downloadTemplate}
            className="btn btn-ghost btn-sm gap-2 touch-manipulation"
          >
            <Download className="size-4" />
            Plantilla vacía
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <input
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          className="file-input file-input-bordered file-input-sm w-full max-w-md"
          aria-label="Archivo CSV"
        />

        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-base-content/70">Modo:</span>
          <select
            name="mode"
            className="select select-bordered select-sm"
            defaultValue="upsert"
            aria-label="Modo de importación"
          >
            <option value="upsert">Crear o actualizar por código</option>
            <option value="insert">Solo crear (omitir duplicados)</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-sm gap-2 touch-manipulation"
        >
          {loading ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <FileUp className="size-4" />
          )}
          {loading ? "Importando…" : "Subir CSV"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-3 text-sm text-error">{error}</p>
      )}

      <p className="mt-3 text-xs text-base-content/50">
        Se procesan lotes de 200 filas. Archivos grandes (5.000+) pueden tardar
        unos segundos.
      </p>
    </section>
  )
}
