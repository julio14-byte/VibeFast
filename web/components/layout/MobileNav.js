"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { flattenNavItems, MOBILE_PRIMARY_HREFS } from "@/lib/app-nav"
import { NAV_ICONS, navShortLabel } from "@/lib/nav-icons"
import MobileMenuSheet from "./MobileMenuSheet"

function isActive(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

const allItems = flattenNavItems()
const primaryItems = MOBILE_PRIMARY_HREFS.map((href) =>
  allItems.find((i) => i.href === href)
).filter(Boolean)

export default function MobileNav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const primaryHrefs = new Set(MOBILE_PRIMARY_HREFS)
  const menuActive =
    menuOpen ||
    allItems.some(
      (item) => !primaryHrefs.has(item.href) && isActive(pathname, item.href)
    )

  const colCount = primaryItems.length + 1

  return (
    <>
      <nav
        className="mobile-nav-bar fixed inset-x-0 bottom-0 z-40 border-t border-base-200 bg-base-100/95 backdrop-blur-md md:hidden"
        aria-label="Accesos rápidos"
      >
        <div
          className="grid gap-0"
          style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
        >
          {primaryItems.map(({ href, label }) => {
            const Icon = NAV_ICONS[href]
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                className={`mobile-nav-item flex flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 text-[10px] font-medium transition-colors touch-manipulation ${
                  active
                    ? "text-primary bg-primary/5"
                    : "text-base-content/65 active:bg-base-200"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className="size-[1.35rem] shrink-0"
                  strokeWidth={active ? 2.25 : 2}
                />
                <span className="max-w-full truncate text-center leading-none">
                  {navShortLabel(href, label)}
                </span>
              </Link>
            )
          })}

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={`mobile-nav-item flex flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 text-[10px] font-medium transition-colors touch-manipulation ${
              menuActive
                ? "text-primary bg-primary/5"
                : "text-base-content/65 active:bg-base-200"
            }`}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            aria-label="Abrir menú completo"
          >
            <Menu className="size-[1.35rem] shrink-0" />
            <span className="max-w-full truncate text-center leading-none">
              Menú
            </span>
          </button>
        </div>
      </nav>

      <MobileMenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
