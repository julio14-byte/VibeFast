"use client"

import { useCallback } from "react"
import { usePathname } from "next/navigation"

/**
 * Si ya estás en la ruta, hace scroll arriba (evita sensación de botón roto).
 */
export function useNavLinkClick(href, { onNavigate } = {}) {
  const pathname = usePathname()

  return useCallback(
    (event) => {
      onNavigate?.()

      const onSameRoute =
        pathname === href ||
        (href !== "/dashboard" && pathname.startsWith(`${href}/`))

      if (onSameRoute) {
        event.preventDefault()
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    },
    [href, onNavigate, pathname]
  )
}
