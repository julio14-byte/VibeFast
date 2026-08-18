"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { deleteAllProductos } from "@/app/(app)/productos/actions"

export default function VaciarCatalogoPanel({ returnTo = "/negocio" }) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.set("confirm", confirm)

    try {
      const result = await deleteAllProductos(formData)
      if (!result?.ok) {
        setError(result?.error ?? "No se pudo vaciar el catálogo.")
        setLoading(false)
        return
      }

      const base = returnTo.split("?")[0]
      window.location.href = `${base}?ok=vaciado&n=${result.eliminados ?? 0}`
    } catch (err) {
      setError(err?.message ?? "Error al vaciar.")
      setLoading(false)
    }
  }

  return (
    <section className="rounded-box border border-error/30 bg-error/5 p-4">
      <h2 className="text-sm font-bold text-error">Vaciar catálogo completo</h2>
      <p className="mt-1 text-xs text-base-content/65">
        Borra <strong>todos</strong> los productos de tu ferretería para volver a
        importarlos desde cero. Las ventas anteriores se conservan; solo se elimina
        el catálogo.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn btn-outline btn-error btn-sm mt-3 gap-2 touch-manipulation"
        >
          <Trash2 className="size-4" />
          Vaciar todos los productos
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <label className="form-control w-full max-w-sm">
            <span className="label-text text-xs font-medium">
              Escribe <strong>VACIAR</strong> para confirmar
            </span>
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input input-bordered input-sm mt-1"
              placeholder="VACIAR"
              autoComplete="off"
              required
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading || confirm !== "VACIAR"}
              className="btn btn-error btn-sm gap-2 touch-manipulation"
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Sí, eliminar todo
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setOpen(false)
                setConfirm("")
                setError(null)
              }}
              className="btn btn-ghost btn-sm touch-manipulation"
            >
              Cancelar
            </button>
          </div>
          {error ? (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          ) : null}
        </form>
      )}
    </section>
  )
}
