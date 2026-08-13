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

const NAV = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
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
    <div className="flex min-h-screen flex-col bg-base-200 pb-16 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-base-200 bg-base-100">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold">
            <Logo className="size-7" />
            {config.brand.logoText}
          </Link>
          <UserMenu user={user} />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6">
        <aside className="hidden w-52 shrink-0 md:block">
          <nav className="menu rounded-box bg-base-100 p-2">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-base-200"
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-base-200 bg-base-100 md:hidden">
        <div className="grid grid-cols-4 gap-0">
          {NAV.slice(0, 4).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium text-base-content/70 hover:bg-base-200"
            >
              <Icon className="size-4" />
              <span className="truncate w-full text-center">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
