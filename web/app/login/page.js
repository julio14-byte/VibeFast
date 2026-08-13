import Link from "next/link"
import { redirect } from "next/navigation"
import config from "@/config"
import { getUser } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import GoogleButton from "@/components/auth/GoogleButton"
import EmailPasswordForm from "@/components/auth/EmailPasswordForm"
import UsernamePasswordForm from "@/components/auth/UsernamePasswordForm"
import Logo from "@/components/Logo"

export const metadata = { title: "Entrar" }
export const dynamic = "force-dynamic"

export default async function LoginPage({ searchParams }) {
  const user = await getUser()
  if (user) redirect(config.auth.afterLoginUrl)

  const params = await searchParams
  const next =
    typeof params?.next === "string" ? params.next : config.auth.afterLoginUrl
  const hasError = params?.error
  const supabaseMisconfigured = params?.error === "supabase"

  const supabaseConfigured = isSupabaseConfigured()
  const googleEnabled = config.features.googleAuth
  const emailEnabled = config.features.emailLogin
  const usernameEnabled = config.features.usernameLogin

  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-base-200 bg-base-100 p-8 shadow-sm">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <Logo className="size-7" />
          {config.brand.logoText}
        </Link>

        <h1 className="mt-6 text-2xl font-bold tracking-tight">Entra a tu cuenta</h1>
        <p className="mt-2 text-sm text-base-content/70">
          Google o correo y contraseña para {config.app.name}.
        </p>

        {hasError && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-sm text-error"
          >
            {supabaseMisconfigured
              ? "Supabase no está configurado."
              : params?.error === "auth"
                ? "Correo o contraseña incorrectos."
                : "No pudimos iniciar sesión. Intenta de nuevo."}
          </div>
        )}

        {!supabaseConfigured && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm"
          >
            Configura Supabase en <code>web/.env.local</code>.
          </div>
        )}

        {googleEnabled && supabaseConfigured && (
          <div className="mt-6">
            <GoogleButton next={next} />
          </div>
        )}

        {googleEnabled && (emailEnabled || usernameEnabled) && supabaseConfigured && (
          <div className="divider my-6 text-xs text-base-content/40">
            {emailEnabled ? "o con correo" : "o con usuario"}
          </div>
        )}

        {emailEnabled && supabaseConfigured && <EmailPasswordForm next={next} />}

        {usernameEnabled && !emailEnabled && supabaseConfigured && (
          <UsernamePasswordForm next={next} />
        )}

        {!googleEnabled && !emailEnabled && !usernameEnabled && (
          <p className="mt-6 text-sm text-base-content/60">
            Activa login en <code>config.js</code>
          </p>
        )}
      </div>
    </main>
  )
}
