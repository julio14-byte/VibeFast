"use client"

import { useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"

/**
 * Navegación fiable en la app (Link + router.push).
 * Evita clics que no cambian de ruta en móvil / Next.js App Router.
 */
export function useAppNavClick(href, { onNavigate } = {}) {
  const pathname = usePathname()
  const router = useRouter()

  return useCallback(
    (event) => {
      event.preventDefault()
      onNavigate?.()

      if (pathname === href) {
        window.scrollTo({ top: 0, behavior: "smooth" })
        return
      }

      router.push(href)
    },
    [href, onNavigate, pathname, router]
  )
}
