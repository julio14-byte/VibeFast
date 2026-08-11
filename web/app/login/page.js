import Link from "next/link"
import { redirect } from "next/navigation"
import config from "@/config"
import { getUser } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import GoogleButton from "@/components/auth/GoogleButton"
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-base-200 bg-base-100 p-8 shadow-sm">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <Logo className="size-7" />
          {config.brand.logoText}
        </Link>

        <h1 className="mt-6 text-2xl font-bold tracking-tight">Entra a tu cuenta</h1>
        <p className="mt-2 text-sm text-base-content/70">
          Usa tu cuenta de Google para acceder a {config.app.name}.
        </p>

        {hasError && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-sm text-error"
          >
            {supabaseMisconfigured
              ? "Supabase no está configurado en Vercel. Agrega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en Environment Variables."
              : "No pudimos iniciar sesión. Revisa Google OAuth en Supabase e intenta de nuevo."}
          </div>
        )}

        {!supabaseConfigured && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-content"
          >
            Falta configurar Supabase. En local usa <code>web/.env.local</code>;
            en Vercel agrega las variables en Settings → Environment Variables.
          </div>
        )}

        <div className="mt-6">
          {googleEnabled ? (
            <GoogleButton next={next} />
          ) : (
            <p className="text-sm text-base-content/60">
              Activa <code>features.googleAuth: true</code> en{" "}
              <code>web/config.js</code> y reinicia el servidor.
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-base-content/50">
          ¿Ya entraste y no ves esta pantalla? Cierra sesión desde el menú de usuario.
        </p>
      </div>
    </main>
  )
}
