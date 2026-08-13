"use client"

import { useState } from "react"

export default function CheckoutButton({
  planId = "pro",
  label = "Suscribirse",
  className = "btn btn-primary",
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleClick() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        throw new Error(data.error || "No se pudo iniciar el checkout.")
      }

      window.location.href = data.url
    } catch (err) {
      setError(err?.message ?? "Error al conectar con Stripe.")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`${className} touch-manipulation`}
        aria-busy={loading}
      >
        {loading ? "Redirigiendo…" : label}
      </button>
      {error && (
        <p role="alert" className="text-xs text-error">{error}</p>
      )}
    </div>
  )
}
