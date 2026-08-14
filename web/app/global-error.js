"use client"

import Link from "next/link"

export default function GlobalError({ error, reset }) {
  return (
    <html lang="es" data-theme="vibefast">
      <body className="flex min-h-dvh items-center justify-center bg-base-200 p-6">
        <div className="max-w-md rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <h1 className="text-lg font-bold">Algo falló en la aplicación</h1>
          <p className="mt-2 text-sm text-base-content/70">
            {error?.message || "Error inesperado en el cliente."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => reset()} className="btn btn-primary btn-sm">
              Reintentar
            </button>
            <Link href="/" className="btn btn-ghost btn-sm">
              Ir al inicio
            </Link>
          </div>
          <p className="mt-4 text-xs text-base-content/50">
            Si persiste: revisa variables en Vercel (Supabase URL/anon key) y redeploya.
          </p>
        </div>
      </body>
    </html>
  )
}
