import { formatPrecio } from "@/lib/productos"
import {
  formaPagoLabel,
  getTicketConfig,
  nombreComercial,
} from "@/lib/negocio/empresa"

/** Vista previa estática del ticket con datos guardados o ejemplo. */
export default function TicketPreview({ empresa }) {
  const cfg = getTicketConfig(empresa)
  const titulo = nombreComercial(empresa)

  const sample = {
    folio: 1,
    fecha: new Date().toLocaleString("es-MX", {
      dateStyle: "short",
      timeStyle: "short",
    }),
    cliente: cfg.mostrarCliente
      ? { nombre: "Cliente ejemplo", rfc: "XAXX010101000" }
      : null,
    items: [
      {
        nombre: "Llave stillson 12″",
        cantidad: 2,
        precio: 185,
        subtotal: 370,
      },
    ],
    subtotal: 318.97,
    iva: 51.03,
    total: 370,
    formaPago: "01",
  }

  return (
    <div
      className="ticket-80mm mx-auto bg-white p-3 font-mono text-[10px] leading-tight text-black shadow-md ring-1 ring-base-300"
      aria-hidden
    >
      <p className="text-center text-xs font-bold">{titulo}</p>
      {cfg.textoExtra && (
        <p className="text-center text-[9px]">{cfg.textoExtra}</p>
      )}
      {cfg.mostrarDireccion && empresa?.direccion && (
        <p className="text-center text-[9px]">{empresa.direccion}</p>
      )}
      {cfg.mostrarTelefono && empresa?.telefono && (
        <p className="text-center text-[9px]">Tel: {empresa.telefono}</p>
      )}
      {cfg.mostrarRfc && empresa?.rfc && (
        <p className="text-center text-[9px]">RFC: {empresa.rfc}</p>
      )}
      <p className="my-1.5 border-t border-dashed border-gray-400" />
      <p>Ticket #{sample.folio}</p>
      <p>{sample.fecha}</p>
      {sample.cliente && (
        <>
          <p>Cliente: {sample.cliente.nombre}</p>
          <p className="text-[9px]">RFC: {sample.cliente.rfc}</p>
        </>
      )}
      <p className="my-1.5 border-t border-dashed border-gray-400" />
      {sample.items.map((item, i) => (
        <div key={i} className="mb-1">
          <p className="truncate">{item.nombre}</p>
          <p className="text-[9px]">
            {item.cantidad} × {formatPrecio(item.precio)} ={" "}
            {formatPrecio(item.subtotal)}
          </p>
        </div>
      ))}
      <p className="my-1.5 border-t border-dashed border-gray-400" />
      {cfg.mostrarIva && (
        <>
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrecio(sample.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>IVA</span>
            <span>{formatPrecio(sample.iva)}</span>
          </div>
        </>
      )}
      <div className="flex justify-between text-xs font-bold">
        <span>TOTAL</span>
        <span>{formatPrecio(sample.total)}</span>
      </div>
      {cfg.mostrarFormaPago && (
        <p className="mt-1 text-[9px]">
          Pago: {formaPagoLabel(sample.formaPago)}
        </p>
      )}
      <p className="my-1.5 border-t border-dashed border-gray-400" />
      <p className="text-center text-[9px]">{cfg.mensajePie}</p>
    </div>
  )
}
