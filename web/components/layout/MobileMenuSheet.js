"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { X, LayoutDashboard } from "lucide-react"
import { NAV_SECTIONS } from "@/lib/app-nav"
import { NAV_ICONS } from "@/lib/nav-icons"
import { useNavLinkClick } from "./useNavLinkClick"

function isActive(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function MobileMenuSheet({ open, onClose }) {
  const pathname = usePathname()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-neutral/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Cerrar menú"
      />
      <div className="mobile-menu-sheet absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-2xl border border-base-200 bg-base-100 shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-base-200 px-4 py-3">
          <div>
            <h2 className="text-base font-bold">Menú</h2>
            <p className="text-xs text-base-content/55">
              Todas las secciones de la tienda
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-square touch-manipulation min-h-11 min-w-11"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-4 safe-area-bottom">
          <div className="space-y-4">
            {NAV_SECTIONS.map((section) => (
              <div key={section.id}>
                <p className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-wide text-base-content/45">
                  {section.title}
                </p>
                <ul className="grid gap-1.5">
                  {section.items.map((item) => (
                    <SheetNavItem
                      key={item.href}
                      item={item}
                      pathname={pathname}
                      onClose={onClose}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SheetNavItem({ item, pathname, onClose }) {
  const Icon = NAV_ICONS[item.href] ?? LayoutDashboard
  const active = isActive(pathname, item.href)
  const onClick = useNavLinkClick(item.href, { onNavigate: onClose })

  return (
    <li>
      <Link
        href={item.href}
        onClick={onClick}
        className={`flex items-center gap-3 rounded-xl border px-3 py-3 touch-manipulation transition-colors min-h-[52px] ${
          active
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-base-200 bg-base-100 active:bg-base-200"
        }`}
        aria-current={active ? "page" : undefined}
      >
        <Icon
          className={`size-5 shrink-0 ${active ? "text-primary" : "opacity-75"}`}
          strokeWidth={active ? 2.25 : 2}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-tight">
            {item.label}
          </span>
          <span className="mt-0.5 block text-xs text-base-content/55 leading-snug">
            {item.hint}
          </span>
        </span>
      </Link>
    </li>
  )
}
