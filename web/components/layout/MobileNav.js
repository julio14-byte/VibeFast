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
  Settings,
  X,
} from "lucide-react"
import {
  flattenNavItems,
  MOBILE_MORE_HREFS,
  MOBILE_PRIMARY_HREFS,
} from "@/lib/app-nav"

const ICONS = {
  "/dashboard": LayoutDashboard,
  "/ventas": ShoppingCart,
  "/productos": PackageSearch,
  "/inventario": Boxes,
  "/clientes": Users,
  "/facturacion": FileText,
  "/chat": MessageSquare,
  "/agent": Bot,
  "/settings": Settings,
}

function isActive(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

const allItems = flattenNavItems()
const primaryItems = MOBILE_PRIMARY_HREFS.map(
  (href) => allItems.find((i) => i.href === href)
).filter(Boolean)
const moreItems = MOBILE_MORE_HREFS.map(
  (href) => allItems.find((i) => i.href === href)
).filter(Boolean)

export default function MobileNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const moreActive = moreItems.some((item) => isActive(pathname, item.href))

  return (
    <>
      <nav
        className="mobile-nav-bar fixed inset-x-0 bottom-0 z-40 border-t border-base-200 bg-base-100/95 backdrop-blur-md md:hidden"
        aria-label="Menú principal"
      >
        <div className="grid grid-cols-6 gap-0">
          {primaryItems.map(({ href, label }) => {
            const Icon = ICONS[href] ?? LayoutDashboard
            const active = isActive(pathname, href)
            const short =
              href === "/dashboard"
                ? "Inicio"
                : href === "/ventas"
                  ? "Cobrar"
                  : href === "/chat"
                    ? "Chat"
                    : href === "/agent"
                      ? "Asistente"
                      : href === "/settings"
                        ? "Ajustes"
                        : label
            return (
              <Link
                key={href}
                href={href}
                className={`mobile-nav-item flex flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-[10px] font-medium transition-colors touch-manipulation ${
                  active
                    ? "text-primary bg-primary/5"
                    : "text-base-content/65 active:bg-base-200"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className="size-5 shrink-0"
                  strokeWidth={active ? 2.25 : 2}
                />
                <span className="truncate w-full text-center leading-tight">
                  {short}
                </span>
              </Link>
            )
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`mobile-nav-item flex flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-[10px] font-medium transition-colors touch-manipulation ${
              moreActive || moreOpen
                ? "text-primary bg-primary/5"
                : "text-base-content/65 active:bg-base-200"
            }`}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            aria-label="Ver más secciones"
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
              <div>
                <h2 className="text-sm font-bold">Más opciones</h2>
                <p className="text-xs text-base-content/55">
                  Productos, clientes y facturas
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="btn btn-ghost btn-sm btn-square touch-manipulation min-h-11 min-w-11"
                aria-label="Cerrar"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2">
              {moreItems.map(({ href, label, hint }) => {
                const Icon = ICONS[href] ?? PackageSearch
                const active = isActive(pathname, href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left touch-manipulation transition-colors min-h-[52px] ${
                      active
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-base-200 bg-base-100 active:bg-base-200"
                    }`}
                  >
                    <Icon className="size-6 shrink-0 opacity-80" />
                    <span>
                      <span className="block text-sm font-semibold">{label}</span>
                      <span className="block text-xs text-base-content/55 mt-0.5">
                        {hint}
                      </span>
                    </span>
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
