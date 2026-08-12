"use client"

import { useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Package,
  PackageSearch,
} from "lucide-react"

const PLACEHOLDER = `Ejemplo: Quedan 3 cajas de tornillos 1/4 en el estante B2 y 12 martillos.`

export default function InventarioCheck({ hasProductos = false }) {
  const [texto, setTexto] = useState("")
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function checar({ desdeCatalogo = false } = {}) {
    setError(null)
    setResultado(null)
    setLoading(true)

    try {
      const res = await fetch("/api/ai/inventario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          desdeCatalogo ? { desdeCatalogo: true } : { texto }
        ),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || `El servidor respondió ${res.status}`)
      }
      setResultado(data)
    } catch (err) {
      setError(
        err?.message
          ? err.message
          : "Algo salió mal. Intenta de nuevo."
      )
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    checar({ desdeCatalogo: false })
  }

  const alertas =
    resultado?.productos?.filter((p) => p.alertaAgotamiento)?.length ?? 0

  return (
    <div className="space-y-4">
      <div className="rounded-box border border-base-200 bg-base-100 p-4">
        <p className="text-sm font-medium">Desde tu catálogo</p>
        <p className="mt-1 text-sm text-base-content/70">
          Resumen con IA. Requiere una{" "}
          <code className="text-xs">OPENAI_API_KEY</code> válida (sk-...).
        </p>
        {!hasProductos && (
          <p className="mt-2 text-sm text-warning">
            Primero agrega productos en la página Productos.
          </p>
        )}
        <button
          type="button"
          className="btn btn-primary mt-3"
          disabled={loading || !hasProductos}
          onClick={() => checar({ desdeCatalogo: true })}
        >
          {loading ? (
            <>
              <span className="loading loading-spinner loading-sm" />
              Analizando…
            </>
          ) : (
            <>
              <PackageSearch className="size-4" />
              Checar mi inventario
            </>
          )}
        </button>
      </div>

      <div className="divider text-xs text-base-content/50">o pega una nota</div>

      <form
        onSubmit={handleSubmit}
        className="rounded-box border border-base-200 bg-base-100 p-4"
      >
        <label
          htmlFor="inventario-texto"
          className="mb-2 block text-sm font-medium"
        >
          Nota libre de inventario
        </label>
        <textarea
          id="inventario-texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={4}
          placeholder={PLACEHOLDER}
          className="textarea textarea-bordered w-full"
          disabled={loading}
        />
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            className="btn btn-outline"
            disabled={loading || !texto.trim()}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                Analizando…
              </>
            ) : (
              <>
                <Package className="size-4" />
                Analizar nota
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div role="alert" className="alert alert-error">
          <AlertCircle className="size-5" />
          <span>{error}</span>
        </div>
      )}

      {resultado && (
        <div className="space-y-4 rounded-box border border-base-200 bg-base-100 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-base-content/50">
                Resumen
              </p>
              <p className="mt-1 text-sm">{resultado.resumen}</p>
            </div>
            {alertas > 0 ? (
              <span className="badge badge-warning gap-1 badge-lg">
                <AlertTriangle className="size-3.5" />
                {alertas} con alerta
              </span>
            ) : (
              <span className="badge badge-success gap-1 badge-lg">
                <CheckCircle2 className="size-3.5" />
                Stock OK
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="text-right">Stock</th>
                  <th>Estado</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {(resultado.productos ?? []).map((item, i) => (
                  <tr key={`${item.producto}-${i}`}>
                    <td>
                      <div className="font-medium">{item.producto}</div>
                      <div className="font-mono text-xs text-base-content/50 tabular-nums">
                        {item.codigo}
                      </div>
                    </td>
                    <td className="text-right">
                      <span
                        className={`badge badge-sm ${
                          item.stock === 0
                            ? "badge-error"
                            : item.alertaAgotamiento
                              ? "badge-warning"
                              : "badge-success"
                        }`}
                      >
                        {item.stock}
                      </span>
                    </td>
                    <td>
                      {item.alertaAgotamiento ? (
                        <span className="inline-flex items-center gap-1 text-sm text-warning">
                          <AlertTriangle className="size-3.5" />
                          Bajo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm text-success">
                          <CheckCircle2 className="size-3.5" />
                          OK
                        </span>
                      )}
                    </td>
                    <td className="max-w-xs text-sm text-base-content/70">
                      {item.mensaje}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
