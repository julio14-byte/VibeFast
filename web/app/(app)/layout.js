import Link from "next/link"
import { redirect } from "next/navigation"
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  PackageSearch,
  ShoppingCart,
  FileText,
  Users,
  Boxes,
} from "lucide-react"
import config from "@/config"
import { getUser } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import UserMenu from "@/components/auth/UserMenu"
import Logo from "@/components/Logo"
import MobileNav from "@/components/layout/MobileNav"

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/productos", label: "Productos", icon: PackageSearch },
  { href: "/inventario", label: "Inventario", icon: Boxes },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/facturacion", label: "Facturación", icon: FileText },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/agent", label: "Agente", icon: Bot },
]

export const dynamic = "force-dynamic"

export default async function AppLayout({ children }) {
  if (!isSupabaseConfigured()) {
    redirect(`${config.auth.loginUrl}?error=supabase`)
  }

  const user = await getUser()
  if (!user) redirect(config.auth.loginUrl)

  return (
    <div className="app-shell flex min-h-dvh min-h-screen flex-col bg-base-200">
      <header className="app-header sticky top-0 z-40 border-b border-base-200 bg-base-100/95 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-2 font-bold touch-manipulation"
          >
            <Logo className="size-7 shrink-0" />
            <span className="truncate text-sm sm:text-base">{config.brand.logoText}</span>
          </Link>
          <UserMenu user={user} />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-3 py-4 sm:px-4 sm:py-6">
        <aside className="hidden w-52 shrink-0 md:block">
          <nav className="menu rounded-box bg-base-100 p-2 shadow-sm">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-base-200 touch-manipulation"
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-safe-nav md:pb-0">{children}</main>
      </div>

      <MobileNav />
    </div>
  )
}
