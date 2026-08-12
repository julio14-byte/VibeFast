import { NextResponse, after } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendWelcome } from "@/lib/resend/send"

const FIRST_LOGIN_WINDOW_MS = 10_000

function safeNextPath(value) {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/dashboard"
  return value
}

function getRedirectBase(request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/$/, "")
  const { origin } = new URL(request.url)
  const isLocal =
    origin.includes("localhost") || origin.includes("127.0.0.1")

  // Desarrollo: quedarse en localhost aunque NEXT_PUBLIC_APP_URL apunte a prod.
  if (isLocal) {
    return origin
  }

  // Producción: URL pública configurada (Vercel) > headers del proxy > origin.
  if (configured && !configured.includes("localhost")) {
    return configured
  }

  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https"
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  return origin
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const next = safeNextPath(searchParams.get("next"))
  const base = getRedirectBase(request)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      after(async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user?.email) return
        const created = new Date(user.created_at).getTime()
        const lastSignIn = new Date(
          user.last_sign_in_at || user.created_at
        ).getTime()
        if (Math.abs(lastSignIn - created) < FIRST_LOGIN_WINDOW_MS) {
          const meta = user.user_metadata || {}
          await sendWelcome(user.email, meta.full_name || meta.name || "")
        }
      })

      return NextResponse.redirect(`${base}${next}`)
    }
  }

  return NextResponse.redirect(`${base}/login?error=auth`)
}
