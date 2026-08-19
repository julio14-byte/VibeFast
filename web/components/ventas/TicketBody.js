import { formatPrecioTicket } from "@/lib/productos"
import {
  TICKET_PAPER_CLASS,
  TICKET_PRINT_AREA_ID,
} from "@/lib/ticket/print"

/**
 * Cuerpo del ticket (vista previa e impresión).
 * Ancho completo del rollo 80 mm, sin márgenes laterales.
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

        <p className="ticket-rule" />

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

        <p className="ticket-rule" />

        {ticket.items.map((item, i) => (
          <div key={i} className="ticket-item">
            <p className="ticket-item-name">{item.nombre}</p>
            <p className="ticket-meta ticket-item-qty">
              <span>
                {item.cantidad} x {formatPrecioTicket(item.precio)}
              </span>
              <span className="ticket-amount">
                {formatPrecioTicket(item.subtotal)}
              </span>
            </p>
          </div>
        ))}

        <p className="ticket-rule" />

        {ticket.mostrarIva ? (
          <>
            <div className="ticket-row">
              <span>Subtotal</span>
              <span className="ticket-amount">
                {formatPrecioTicket(ticket.subtotal)}
              </span>
            </div>
            <div className="ticket-row">
              <span>IVA</span>
              <span className="ticket-amount">
                {formatPrecioTicket(ticket.iva)}
              </span>
            </div>
          </>
        ) : null}

        <div className="ticket-total ticket-row font-bold">
          <span>TOTAL</span>
          <span className="ticket-amount">
            {formatPrecioTicket(ticket.total)}
          </span>
        </div>

        {ticket.mostrarFormaPago && ticket.formaPagoLabel ? (
          <p className="ticket-meta">Pago: {ticket.formaPagoLabel}</p>
        ) : null}
        {ticket.notas ? (
          <p className="ticket-meta">Notas: {ticket.notas}</p>
        ) : null}

        <p className="ticket-rule" />
        <p className="ticket-meta text-center">
          {ticket.mensajePie || "¡Gracias por su compra!"}
        </p>
      </div>
    </div>
  )
}
