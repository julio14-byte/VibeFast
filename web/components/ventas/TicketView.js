"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Printer } from "lucide-react"
import TicketBody from "@/components/ventas/TicketBody"
import {
  getTicketPrintConfig,
  getTicketPrintCssVars,
  ticketPrintSetupHint,
  TICKET_PRINT_ROOT_CLASS,
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

    return () => {
      root.classList.remove(TICKET_PRINT_ROOT_CLASS)
      for (const key of Object.keys(vars)) {
        root.style.removeProperty(key)
      }
    }
  }, [])

  useEffect(() => {
    if (!autoPrint) return
    const t = setTimeout(() => window.print(), printConfig.autoPrintDelayMs)
    return () => clearTimeout(t)
  }, [autoPrint, printConfig.autoPrintDelayMs])

  return (
    <>
      <div className="no-print mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
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
        <p className="text-xs text-base-content/60">{ticketPrintSetupHint()}</p>
      </div>

      <TicketBody ticket={ticket} />
    </>
  )
}
