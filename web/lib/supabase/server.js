// ============================================================
// Supabase · cliente de servidor
// ------------------------------------------------------------
// Úsalo en Server Components, Route Handlers y Server Actions.
// Lee/escribe las cookies de sesión vía next/headers.
//
// El bloque try/catch en setAll es necesario: desde un Server
// Component no se pueden escribir cookies (solo leer). El refresh
// de sesión lo hace el middleware, así que ahí el catch es inocuo.
// ============================================================

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { isSupabaseConfigured } from "./env"

export async function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase no configurado: faltan variables de entorno.")
  }

  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Llamado desde un Server Component: ignorar.
            // El middleware ya se encarga de refrescar la sesión.
          }
        },
      },
    }
  )
}

// Helper: devuelve el usuario autenticado o null.
// Usa getUser() (valida el JWT contra Supabase), no getSession().
export async function getUser() {
  if (!isSupabaseConfigured()) return null

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) return null
    return user
  } catch {
    return null
  }
}
