"use client"

import { useState } from "react"

export default function BillingPortalButton({ label = "Administrar suscripción" }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function openPortal() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        credentials: "include",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        throw new Error(data.error || "No se pudo abrir el portal.")
      }
      window.location.href = data.url
    } catch (err) {
      setError(err?.message ?? "Error al abrir Stripe.")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={openPortal}
        disabled={loading}
        className="btn btn-outline touch-manipulation"
        aria-busy={loading}
      >
        {loading ? "Abriendo…" : label}
      </button>
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
    </div>
  )
}
