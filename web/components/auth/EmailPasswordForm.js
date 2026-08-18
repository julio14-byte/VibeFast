"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function normalizeEmail(value) {
  return value.trim().toLowerCase()
}

export default function EmailPasswordForm({ next = "/dashboard" }) {
  const [mode, setMode] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!supabaseConfigured) {
      setError("Supabase no está configurado.")
      return
    }

    const normalizedEmail = normalizeEmail(email)
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Ingresa un correo electrónico válido.")
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    const supabase = createClient()

    try {
      if (mode === "register") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        })

        if (signUpError) throw signUpError

        if (data.session) {
          window.location.assign(next)
          return
        }

        setMessage(
          "Cuenta creada. Si tu proyecto requiere confirmación, revisa tu correo; luego entra con email y contraseña."
        )
        setMode("login")
        setLoading(false)
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (signInError) {
        if (signInError.message?.includes("Invalid login")) {
          throw new Error("Correo o contraseña incorrectos.")
        }
        throw signInError
      }

      window.location.assign(next)
    } catch (err) {
      setError(err?.message || "No se pudo completar la operación.")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex rounded-lg border border-base-300 p-1 bg-base-200/50">
        <button
          type="button"
          className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
            mode === "login"
              ? "bg-base-100 shadow-sm text-base-content"
              : "text-base-content/60 hover:text-base-content"
          }`}
          onClick={() => {
            setMode("login")
            setError(null)
            setMessage(null)
          }}
        >
          Entrar
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
            mode === "register"
              ? "bg-base-100 shadow-sm text-base-content"
              : "text-base-content/60 hover:text-base-content"
          }`}
          onClick={() => {
            setMode("register")
            setError(null)
            setMessage(null)
          }}
        >
          Crear cuenta
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label py-1" htmlFor="auth-email">
            <span className="label-text text-xs font-medium">Correo electrónico</span>
          </label>
          <input
            id="auth-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label className="label py-1" htmlFor="auth-password">
            <span className="label-text text-xs font-medium">Contraseña</span>
          </label>
          <input
            id="auth-password"
            type="password"
            required
            minLength={6}
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="input input-bordered w-full"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !supabaseConfigured}
          className="btn btn-outline w-full border-base-300"
          aria-busy={loading}
        >
          {loading
            ? mode === "register"
              ? "Creando cuenta…"
              : "Entrando…"
            : mode === "register"
              ? "Crear cuenta"
              : "Entrar"}
        </button>
      </form>

      {message && (
        <p role="status" className="text-sm text-success">{message}</p>
      )}
      {error && (
        <p role="alert" className="text-sm text-error">{error}</p>
      )}

      <p className="text-xs text-base-content/50">
        En Supabase activa el provider <strong>Email</strong>. En desarrollo puedes
        desactivar la confirmación de correo para entrar al instante.
      </p>
    </div>
  )
}
