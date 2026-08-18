import { SAT_FORMAS_PAGO } from "@/lib/sat/catalogos"

export const TICKET_DEFAULTS = {
  ticket_mensaje_pie: "¡Gracias por su compra!",
  ticket_mostrar_rfc: true,
  ticket_mostrar_direccion: true,
  ticket_mostrar_telefono: true,
  ticket_mostrar_cliente: true,
  ticket_mostrar_iva: true,
  ticket_mostrar_forma_pago: true,
}

/** Datos del negocio (empresa_fiscal) por organización. */
export async function getEmpresaForOrganization(supabase, organizationId) {
  const { data, error } = await supabase
    .from("empresa_fiscal")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle()

  if (error) {
    console.error("[negocio] getEmpresaForOrganization:", error.message)
    return null
  }
  return data
}

export function nombreComercial(empresa) {
  return (
    empresa?.nombre_comercial?.trim() ||
    empresa?.razon_social?.trim() ||
    "Mi ferretería"
  )
}

export function formaPagoLabel(clave) {
  return SAT_FORMAS_PAGO.find((f) => f.clave === clave)?.nombre ?? clave
}

/** Opciones efectivas para renderizar ticket. */
export function getTicketConfig(empresa) {
  return {
    titulo: nombreComercial(empresa),
    mensajePie:
      empresa?.ticket_mensaje_pie?.trim() || TICKET_DEFAULTS.ticket_mensaje_pie,
    textoExtra: empresa?.ticket_texto_extra?.trim() || "",
    mostrarRfc: empresa?.ticket_mostrar_rfc ?? TICKET_DEFAULTS.ticket_mostrar_rfc,
    mostrarDireccion:
      empresa?.ticket_mostrar_direccion ??
      TICKET_DEFAULTS.ticket_mostrar_direccion,
    mostrarTelefono:
      empresa?.ticket_mostrar_telefono ??
      TICKET_DEFAULTS.ticket_mostrar_telefono,
    mostrarCliente:
      empresa?.ticket_mostrar_cliente ??
      TICKET_DEFAULTS.ticket_mostrar_cliente,
    mostrarIva:
      empresa?.ticket_mostrar_iva ?? TICKET_DEFAULTS.ticket_mostrar_iva,
    mostrarFormaPago:
      empresa?.ticket_mostrar_forma_pago ??
      TICKET_DEFAULTS.ticket_mostrar_forma_pago,
  }
}

export function empresaConfigurada(empresa) {
  return Boolean(
    empresa?.rfc?.trim() &&
      empresa?.razon_social?.trim() &&
      empresa?.codigo_postal?.trim()
  )
}
