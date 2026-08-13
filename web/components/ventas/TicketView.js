"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Printer } from "lucide-react"
import { formatPrecio } from "@/lib/productos"

export default function TicketView({ ticket, autoPrint = false }) {
  useEffect(() => {
    if (autoPrint) {
      const t = setTimeout(() => window.print(), 400)
      return () => clearTimeout(t)
    }
  }, [autoPrint])

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
      </div>

      <div
        id="ticket-print"
        className="ticket-80mm mx-auto bg-white p-3 font-mono text-[11px] leading-tight text-black shadow-lg print:shadow-none"
      >
        <p className="text-center text-sm font-bold">{ticket.titulo}</p>
        {ticket.direccion && (
          <p className="text-center text-[10px]">{ticket.direccion}</p>
        )}
        {ticket.rfc && (
          <p className="text-center text-[10px]">RFC: {ticket.rfc}</p>
        )}
        <p className="my-2 border-t border-dashed border-gray-400" />
        <p>Ticket #{ticket.folio}</p>
        <p>{ticket.fecha}</p>
        {ticket.cliente && (
          <>
            <p>Cliente: {ticket.cliente.nombre}</p>
            {ticket.cliente.rfc && <p>RFC: {ticket.cliente.rfc}</p>}
          </>
        )}
        <p className="my-2 border-t border-dashed border-gray-400" />
        {ticket.items.map((item, i) => (
          <div key={i} className="mb-1">
            <p className="truncate">{item.nombre}</p>
            <p className="text-[10px]">
              {item.cantidad} × {formatPrecio(item.precio)} ={" "}
              {formatPrecio(item.subtotal)}
            </p>
          </div>
        ))}
        <p className="my-2 border-t border-dashed border-gray-400" />
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrecio(ticket.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>IVA</span>
          <span>{formatPrecio(ticket.iva)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold">
          <span>TOTAL</span>
          <span>{formatPrecio(ticket.total)}</span>
        </div>
        <p className="my-2 border-t border-dashed border-gray-400" />
        <p className="text-center text-[10px]">¡Gracias por su compra!</p>
      </div>
    </>
  )
}
