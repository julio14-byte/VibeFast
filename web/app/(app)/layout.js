import Link from "next/link"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import config from "@/config"
import { getUser } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { getPaywallRedirect } from "@/plugins/stripe"
import UserMenu from "@/components/auth/UserMenu"
import Logo from "@/components/Logo"
import AppSidebar from "@/components/layout/AppSidebar"
import MobileNav from "@/components/layout/MobileNav"

export const dynamic = "force-dynamic"

export default async function AppLayout({ children }) {
  if (!isSupabaseConfigured()) {
    redirect(`${config.auth.loginUrl}?error=supabase`)
  }

  const user = await getUser()
  if (!user) redirect(config.auth.loginUrl)

  const pathname = (await headers()).get("x-pathname") || ""

  const paywallRedirect = await getPaywallRedirect(user.id, pathname)
  if (paywallRedirect) {
    redirect(paywallRedirect)
  }

  return (
    <div className="app-shell flex min-h-dvh min-h-screen flex-col bg-base-200">
      <header className="app-header sticky top-0 z-40 border-b border-base-200 bg-base-100/95 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5">
          <Link
            href="/dashboard"
            className="flex min-w-0 flex-1 items-center gap-2 font-bold touch-manipulation"
          >
            <Logo className="size-7 shrink-0" />
            <span className="truncate text-sm sm:text-base">
              {config.brand.logoText}
            </span>
          </Link>
          <UserMenu user={user} />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-3 py-3 sm:px-4 sm:py-6">
        <aside className="hidden w-60 shrink-0 md:block">
          <AppSidebar />
        </aside>

        <main className="app-main min-w-0 flex-1 overflow-x-hidden pb-safe-nav md:pb-0">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
