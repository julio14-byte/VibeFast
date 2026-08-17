"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import MobileMenuSheet from "./MobileMenuSheet"

export default function MobileHeaderMenu() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-ghost btn-sm btn-square touch-manipulation min-h-11 min-w-11 md:hidden"
        aria-label="Abrir menú"
        aria-expanded={open}
      >
        <Menu className="size-5" />
      </button>
      <MobileMenuSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}
