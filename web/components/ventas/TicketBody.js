import { formatPrecio } from "@/lib/productos"
import {
  TICKET_PAPER_CLASS,
  TICKET_PRINT_AREA_ID,
} from "@/lib/ticket/print"

/**
 * Cuerpo del ticket (vista previa e impresión).
 * Estructura: rollo 80 mm → contenido 72 mm centrado con márgenes laterales.
 */
export default function TicketBody({ ticket, preview = false }) {
  const paperClass = preview
    ? `${TICKET_PAPER_CLASS} shadow-md ring-1 ring-base-300`
    : `${TICKET_PAPER_CLASS} shadow-lg print:shadow-none`

  return (
    <div
      id={preview ? undefined : TICKET_PRINT_AREA_ID}
      className={`${paperClass} bg-white text-black`}
      aria-hidden={preview || undefined}
    >
      <div className="ticket-print-area">
        <p className="ticket-title text-center font-bold">{ticket.titulo}</p>
        {ticket.textoExtra ? (
          <p className="ticket-meta text-center">{ticket.textoExtra}</p>
        ) : null}
        {ticket.direccion ? (
          <p className="ticket-meta text-center">{ticket.direccion}</p>
        ) : null}
        {ticket.telefono ? (
          <p className="ticket-meta text-center">Tel: {ticket.telefono}</p>
        ) : null}
        {ticket.rfc ? (
          <p className="ticket-meta text-center">RFC: {ticket.rfc}</p>
        ) : null}

        <p className="ticket-rule my-2 border-t border-dashed border-gray-400" />

        <p>Ticket #{ticket.folio}</p>
        <p>{ticket.fecha}</p>

        {ticket.cliente ? (
          <>
            <p>Cliente: {ticket.cliente.nombre}</p>
            {ticket.cliente.rfc ? (
              <p className="ticket-meta">RFC: {ticket.cliente.rfc}</p>
            ) : null}
          </>
        ) : null}

        <p className="ticket-rule my-2 border-t border-dashed border-gray-400" />

        {ticket.items.map((item, i) => (
          <div key={i} className="ticket-item mb-1">
            <p className="ticket-item-name">{item.nombre}</p>
            <p className="ticket-meta">
              {item.cantidad} × {formatPrecio(item.precio)} ={" "}
              {formatPrecio(item.subtotal)}
            </p>
          </div>
        ))}

        <p className="ticket-rule my-2 border-t border-dashed border-gray-400" />

        {ticket.mostrarIva ? (
          <>
            <div className="ticket-row flex justify-between gap-2">
              <span>Subtotal</span>
              <span>{formatPrecio(ticket.subtotal)}</span>
            </div>
            <div className="ticket-row flex justify-between gap-2">
              <span>IVA</span>
              <span>{formatPrecio(ticket.iva)}</span>
            </div>
          </>
        ) : null}

        <div className="ticket-total flex justify-between gap-2 font-bold">
          <span>TOTAL</span>
          <span>{formatPrecio(ticket.total)}</span>
        </div>

        {ticket.mostrarFormaPago && ticket.formaPagoLabel ? (
          <p className="ticket-meta mt-1">Pago: {ticket.formaPagoLabel}</p>
        ) : null}
        {ticket.notas ? (
          <p className="ticket-meta mt-1">Notas: {ticket.notas}</p>
        ) : null}

        <p className="ticket-rule my-2 border-t border-dashed border-gray-400" />
        <p className="ticket-meta text-center">
          {ticket.mensajePie || "¡Gracias por su compra!"}
        </p>
      </div>
    </div>
  )
}
