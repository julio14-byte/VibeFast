import {
  formaPagoLabel,
  getTicketConfig,
  nombreComercial,
} from "@/lib/negocio/empresa"
import TicketBody from "@/components/ventas/TicketBody"

/** Vista previa estática del ticket con datos guardados o ejemplo. */
export default function TicketPreview({ empresa }) {
  const cfg = getTicketConfig(empresa)
  const titulo = nombreComercial(empresa)

  const ticket = {
    titulo,
    textoExtra: cfg.textoExtra,
    direccion: cfg.mostrarDireccion ? empresa?.direccion || "" : "",
    telefono: cfg.mostrarTelefono ? empresa?.telefono || "" : "",
    rfc: cfg.mostrarRfc ? empresa?.rfc || "" : "",
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
    formaPagoLabel: formaPagoLabel("01"),
    notas: null,
    mostrarIva: cfg.mostrarIva,
    mostrarFormaPago: cfg.mostrarFormaPago,
    mensajePie: cfg.mensajePie,
  }

  return <TicketBody ticket={ticket} preview />
}
