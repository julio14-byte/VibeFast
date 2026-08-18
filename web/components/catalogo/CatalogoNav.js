"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CATALOGO_TABS } from "@/lib/catalogo/nav"

function isActive(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function CatalogoNav() {
  const pathname = usePathname()

  return (
    <nav
      className="flex gap-1 overflow-x-auto rounded-box border border-base-200 bg-base-100 p-1 scrollbar-none"
      aria-label="Secciones del catálogo"
    >
      {CATALOGO_TABS.map((tab) => {
        const active = isActive(pathname, tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm touch-manipulation transition-colors min-h-11 flex flex-col justify-center ${
              active
                ? "bg-primary text-primary-content font-semibold"
                : "text-base-content/75 hover:bg-base-200"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <span>{tab.label}</span>
            {!active && (
              <span className="text-[10px] leading-tight opacity-70 hidden sm:block">
                {tab.hint}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
