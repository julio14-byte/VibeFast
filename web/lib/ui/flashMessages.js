/** Mensajes flash (?ok=…) para catálogo / productos. */
export function productoOkMessage(ok, { nombre } = {}) {
  switch (ok) {
    case "creado":
      return nombre
        ? `Producto «${nombre}» agregado con éxito.`
        : "Producto agregado con éxito."
    case "actualizado":
      return "Cambios guardados."
    case "eliminado":
      return "Producto eliminado."
    default:
      return null
  }
}

/** Mensajes flash en Consulta de precios. */
export function preciosOkMessage(ok, { nombre } = {}) {
  switch (ok) {
    case "creado":
      return nombre
        ? `Producto «${nombre}» agregado con éxito.`
        : "Producto agregado con éxito."
    case "actualizado":
      return "Precios actualizados."
    default:
      return null
  }
}
