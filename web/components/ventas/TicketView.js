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
        <Link href="/negocio" className="btn btn-ghost btn-sm">
          Editar ticket
        </Link>
      </div>

      <div
        id="ticket-print"
        className="ticket-80mm mx-auto bg-white p-3 font-mono text-[11px] leading-tight text-black shadow-lg print:shadow-none"
      >
        <p className="text-center text-sm font-bold">{ticket.titulo}</p>
        {ticket.textoExtra && (
          <p className="text-center text-[10px]">{ticket.textoExtra}</p>
        )}
        {ticket.direccion && (
          <p className="text-center text-[10px]">{ticket.direccion}</p>
        )}
        {ticket.telefono && (
          <p className="text-center text-[10px]">Tel: {ticket.telefono}</p>
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
        {ticket.mostrarIva && (
          <>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrecio(ticket.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA</span>
              <span>{formatPrecio(ticket.iva)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between text-sm font-bold">
          <span>TOTAL</span>
          <span>{formatPrecio(ticket.total)}</span>
        </div>
        {ticket.mostrarFormaPago && ticket.formaPagoLabel && (
          <p className="mt-1 text-[10px]">Pago: {ticket.formaPagoLabel}</p>
        )}
        {ticket.notas && (
          <p className="mt-1 text-[10px]">Notas: {ticket.notas}</p>
        )}
        <p className="my-2 border-t border-dashed border-gray-400" />
        <p className="text-center text-[10px]">
          {ticket.mensajePie || "¡Gracias por su compra!"}
        </p>
      </div>
    </>
  )
}
