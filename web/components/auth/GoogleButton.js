"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Botón de "Entrar con Google". Dispara el flujo OAuth de Supabase.
export default function GoogleButton({ next = "/dashboard" }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function signIn() {
    if (!supabaseConfigured) {
      setError("Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en web/.env.local.")
      return
    }

    setLoading(true)
    setError(null)
    const supabase = createClient()
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    })
    if (authError) {
      setError(authError.message)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={signIn}
        disabled={loading || !supabaseConfigured}
        aria-busy={loading}
        className="btn btn-primary w-full gap-3"
      >
        {loading ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          <svg className="size-5" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
            />
          </svg>
        )}
        {loading ? "Conectando…" : "Entrar con Google"}
      </button>

      {!supabaseConfigured && (
        <p className="text-sm text-warning">
          Copia tus keys de Supabase a <code>web/.env.local</code> y reinicia{" "}
          <code>npm run dev</code>.
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
    </div>
  )
}
