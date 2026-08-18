"use client"

import { useCallback } from "react"
import { usePathname } from "next/navigation"

/**
 * Scroll al tope si ya estás en la ruta; en otras rutas deja que <Link> navegue.
 * Evita preventDefault + router.push, que en móvil a veces no cambia de página.
 */
export function useAppNavClick(href, { onNavigate } = {}) {
  const pathname = usePathname()

  return useCallback(
    (event) => {
      if (pathname === href) {
        event.preventDefault()
        window.scrollTo({ top: 0, behavior: "smooth" })
        return
      }

      onNavigate?.()
    },
    [href, onNavigate, pathname]
  )
}
