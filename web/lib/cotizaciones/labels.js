export const COTIZACION_ESTADOS = {
  borrador: { label: "Borrador", badge: "badge-ghost" },
  enviada: { label: "Enviada", badge: "badge-info" },
  convertida: { label: "Aprobada · venta", badge: "badge-success" },
  rechazada: { label: "Rechazada", badge: "badge-error" },
  vencida: { label: "Vencida", badge: "badge-warning" },
}

export function cotizacionEstadoLabel(estado) {
  return COTIZACION_ESTADOS[estado]?.label ?? estado
}

export function cotizacionEstadoBadge(estado) {
  return COTIZACION_ESTADOS[estado]?.badge ?? "badge-ghost"
}

export function cotizacionPuedeEditar(estado) {
  return estado === "borrador" || estado === "enviada"
}

export function cotizacionPuedeConvertir(estado) {
  return estado === "borrador" || estado === "enviada"
}
