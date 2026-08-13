"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  normalizeUsername,
  usernameToAuthEmail,
  validateUsername,
} from "@/lib/auth/username"

const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function UsernamePasswordForm({ next = "/dashboard" }) {
  const [mode, setMode] = useState("login")
  const [username, setUsername] = useState("")
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

    const validation = validateUsername(username)
    if (!validation.ok) {
      setError(validation.error)
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    const supabase = createClient()
    const normalized = validation.username
    const authEmail = usernameToAuthEmail(normalized)

    try {
      if (mode === "register") {
        const { data: available, error: rpcError } = await supabase.rpc(
          "is_username_available",
          { check_username: normalized }
        )

        if (rpcError) throw rpcError
        if (!available) {
          throw new Error("Ese usuario ya está registrado.")
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: authEmail,
          password,
          options: {
            data: { username: normalized },
            emailRedirectTo: undefined,
          },
        })

        if (signUpError) throw signUpError

        if (data.session) {
          window.location.href = next
          return
        }

        setMessage("Cuenta creada. Ya puedes entrar con tu usuario y contraseña.")
        setMode("login")
        setLoading(false)
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password,
      })

      if (signInError) {
        if (signInError.message?.includes("Invalid login")) {
          throw new Error("Usuario o contraseña incorrectos.")
        }
        throw signInError
      }

      window.location.href = next
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
          <label className="label py-1" htmlFor="auth-username">
            <span className="label-text text-xs font-medium">Usuario</span>
          </label>
          <input
            id="auth-username"
            type="text"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(normalizeUsername(e.target.value))}
            placeholder="ej. mostrador01"
            className="input input-bordered w-full font-mono"
            minLength={3}
            maxLength={32}
            pattern="[a-z0-9_]+"
          />
          <p className="mt-1 text-xs text-base-content/50">
            Solo letras minúsculas, números y guion bajo.
          </p>
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
            ? "Procesando…"
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
        En Supabase activa el provider <strong>Email</strong> (sin confirmación
        de correo en desarrollo). El usuario no usa email visible.
      </p>
    </div>
  )
}
