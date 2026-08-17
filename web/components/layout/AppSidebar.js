"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard } from "lucide-react"
import { NAV_SECTIONS } from "@/lib/app-nav"
import { NAV_ICONS } from "@/lib/nav-icons"

function isActive(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function AppSidebar() {
  const pathname = usePathname()

  return (
    <nav className="app-sidebar space-y-4" aria-label="Menú principal">
      {NAV_SECTIONS.map((section) => (
        <div key={section.id}>
          <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wide text-base-content/45">
            {section.title}
          </p>
          <ul className="menu menu-sm gap-0.5 rounded-box bg-base-100 p-2 shadow-sm">
            {section.items.map((item) => {
              const Icon = NAV_ICONS[item.href] ?? LayoutDashboard
              const active = isActive(pathname, item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-start gap-3 rounded-lg px-3 py-2.5 touch-manipulation ${
                      active
                        ? "bg-primary/10 font-semibold text-primary"
                        : "hover:bg-base-200"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon
                      className={`mt-0.5 size-5 shrink-0 ${active ? "text-primary" : "opacity-70"}`}
                      strokeWidth={active ? 2.25 : 2}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm leading-tight">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-base-content/50 font-normal">
                        {item.hint}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
