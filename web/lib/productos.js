// Formato de moneda y búsqueda de productos (cliente y servidor).

export {
  SAT_FORMAS_PAGO,
  SAT_USOS_CFDI,
  SAT_REGIMENES,
  USO_CFDI_PUBLICO_GENERAL,
} from "@/lib/sat/catalogos"

export function formatPrecio(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value) || 0)
}

/** Precio compacto para ticket térmico (sin separador de miles, siempre 2 decimales). */
export function formatPrecioTicket(value) {
  const n = Math.round((Number(value) || 0) * 100) / 100
  return `$${n.toFixed(2)}`
}

export function normalizeSearch(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export function filterProductos(productos, query) {
  const q = normalizeSearch(query).trim()
  if (!q) return productos ?? []

  const terms = q.split(/\s+/).filter(Boolean)

  return (productos ?? []).filter((p) => {
    const nombre = normalizeSearch(p.nombre)
    const codigo = normalizeSearch(String(p.codigo))

    return terms.every((term) => {
      if (codigo.includes(term)) return true
      if (nombre.startsWith(term) || nombre.includes(term)) return true
      return false
    })
  })
}

export function getPrecioVenta(producto, tipo = "publico") {
  if (tipo === "mayoreo") {
    return Number(producto.precio_mayoreo ?? producto.precio ?? 0)
  }
  return Number(producto.precio_publico ?? producto.precio ?? 0)
}
