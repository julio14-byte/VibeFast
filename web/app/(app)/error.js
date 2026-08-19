"use client"

import Link from "next/link"
import { useEffect } from "react"

export default function AppError({ error, reset }) {
  useEffect(() => {
    console.error("[app] Server render error:", error)
  }, [error])

  const digest = error?.digest ? ` (ref: ${error.digest})` : ""

  return (
    <div
      role="alert"
      className="mx-auto max-w-lg rounded-2xl border border-error/30 bg-base-100 p-6 shadow-sm"
    >
      <h1 className="text-lg font-bold text-error">No pudimos cargar esta página</h1>
      <p className="mt-2 text-sm text-base-content/70">
        Ocurrió un error al renderizar. Intenta de nuevo o vuelve al inicio.
        {digest}
      </p>
      {process.env.NODE_ENV !== "production" && error?.message ? (
        <pre className="mt-3 overflow-x-auto rounded-lg bg-base-200 p-3 text-xs">
          {error.message}
        </pre>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => reset()} className="btn btn-primary btn-sm">
          Reintentar
        </button>
        <Link href="/dashboard" className="btn btn-outline btn-sm">
          Ir al dashboard
        </Link>
        <Link href="/ventas" className="btn btn-ghost btn-sm">
          Ir a ventas
        </Link>
      </div>
    </div>
  )
}
