// ============================================================
// Supabase · cliente de navegador
// ------------------------------------------------------------
// Úsalo en Client Components ("use client"). Lee las claves
// públicas de NEXT_PUBLIC_*. NUNCA pongas la service_role aquí.
//
// Ejemplo:
//   "use client"
//   import { createClient } from "@/lib/supabase/client"
//   const supabase = createClient()
//   await supabase.from("productos").select()
// ============================================================

import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
