"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  MessageSquare,
  LayoutGrid,
  PackageSearch,
  Users,
  FileText,
  Bot,
  X,
} from "lucide-react"

const PRIMARY = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/inventario", label: "Stock", icon: Boxes },
]

const MORE = [
  { href: "/productos", label: "Productos", icon: PackageSearch },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/facturacion", label: "Facturación", icon: FileText },
  { href: "/agent", label: "Agente", icon: Bot },
]

function isActive(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function MobileNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const moreActive = MORE.some((item) => isActive(pathname, item.href))

  return (
    <>
      <nav
        className="mobile-nav-bar fixed inset-x-0 bottom-0 z-40 border-t border-base-200 bg-base-100/95 backdrop-blur-md md:hidden"
        aria-label="Navegación principal"
      >
        <div className="grid grid-cols-5 gap-0">
          {PRIMARY.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                className={`mobile-nav-item flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors touch-manipulation ${
                  active
                    ? "text-primary bg-primary/5"
                    : "text-base-content/65 active:bg-base-200"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-5 shrink-0" strokeWidth={active ? 2.25 : 2} />
                <span className="truncate w-full text-center leading-tight">{label}</span>
              </Link>
            )
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`mobile-nav-item flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors touch-manipulation ${
              moreActive || moreOpen
                ? "text-primary bg-primary/5"
                : "text-base-content/65 active:bg-base-200"
            }`}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            aria-label="Más opciones"
          >
            <LayoutGrid className="size-5 shrink-0" />
            <span className="truncate w-full text-center leading-tight">Más</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-neutral/40 backdrop-blur-[2px]"
            onClick={() => setMoreOpen(false)}
            aria-label="Cerrar menú"
          />
          <div
            className="mobile-more-sheet absolute inset-x-0 bottom-0 rounded-t-2xl border border-base-200 bg-base-100 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-base-200 px-4 py-3">
              <h2 className="text-sm font-bold">Más opciones</h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="btn btn-ghost btn-sm btn-square touch-manipulation"
                aria-label="Cerrar"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4">
              {MORE.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium touch-manipulation transition-colors ${
                      active
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-base-200 bg-base-100 active:bg-base-200"
                    }`}
                  >
                    <Icon className="size-5 shrink-0 opacity-80" />
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
