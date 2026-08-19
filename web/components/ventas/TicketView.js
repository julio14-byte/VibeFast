"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Printer } from "lucide-react"
import TicketBody from "@/components/ventas/TicketBody"
import {
  getTicketPrintConfig,
  getTicketPrintCssVars,
  TICKET_PRINT_ROOT_CLASS,
  TICKET_PRINT_AREA_ID,
} from "@/lib/ticket/print"

export default function TicketView({ ticket, autoPrint = false }) {
  const printConfig = getTicketPrintConfig()

  useEffect(() => {
    const root = document.documentElement
    const vars = getTicketPrintCssVars()

    root.classList.add(TICKET_PRINT_ROOT_CLASS)
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value)
    }

    const ticketEl = document.getElementById(TICKET_PRINT_AREA_ID)
    if (ticketEl) {
      ticketEl.style.marginLeft = `${printConfig.printOffsetLeftMm}mm`
      ticketEl.style.width = `${printConfig.printWidthMm}mm`
      ticketEl.style.maxWidth = `${printConfig.printWidthMm}mm`
      ticketEl.style.paddingLeft = "0"
      ticketEl.style.paddingRight = "0"
      ticketEl.style.boxSizing = "border-box"
    }

    return () => {
      root.classList.remove(TICKET_PRINT_ROOT_CLASS)
      for (const key of Object.keys(vars)) {
        root.style.removeProperty(key)
      }
      const el = document.getElementById(TICKET_PRINT_AREA_ID)
      if (el) {
        el.style.removeProperty("margin-left")
        el.style.removeProperty("width")
        el.style.removeProperty("max-width")
        el.style.removeProperty("padding-left")
        el.style.removeProperty("padding-right")
        el.style.removeProperty("box-sizing")
      }
    }
  }, [printConfig.printOffsetLeftMm, printConfig.printWidthMm])

  useEffect(() => {
    if (!autoPrint) return
    const t = setTimeout(() => window.print(), printConfig.autoPrintDelayMs)
    return () => clearTimeout(t)
  }, [autoPrint, printConfig.autoPrintDelayMs])

  return (
    <>
      <div className="no-print mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="btn btn-primary btn-sm gap-2"
        >
          <Printer className="size-4" />
          Imprimir ticket
        </button>
        <Link href="/ventas" className="btn btn-outline btn-sm">
          Volver a ventas
        </Link>
        <Link href="/negocio" className="btn btn-ghost btn-sm">
          Editar ticket
        </Link>
      </div>

      <TicketBody ticket={ticket} />
    </>
  )
}
