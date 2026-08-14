// Formato de moneda y búsqueda de productos (cliente y servidor).

export function formatPrecio(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value) || 0)
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
    const codigo = String(p.codigo)

    return terms.every((term) => {
      if (codigo.includes(term)) return true
      if (nombre.includes(term)) return true
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

// Catálogos SAT usados en la UI
export const SAT_FORMAS_PAGO = [
  { clave: "01", nombre: "Efectivo" },
  { clave: "03", nombre: "Transferencia" },
  { clave: "04", nombre: "Tarjeta de crédito" },
  { clave: "28", nombre: "Tarjeta de débito" },
]

export const SAT_USOS_CFDI = [
  { clave: "G01", nombre: "Adquisición de mercancías" },
  { clave: "G03", nombre: "Gastos en general" },
  { clave: "S01", nombre: "Sin efectos fiscales" },
  { clave: "P01", nombre: "Por definir" },
]

export const SAT_REGIMENES = [
  { clave: "601", nombre: "General de Ley Personas Morales" },
  { clave: "612", nombre: "Personas Físicas con Actividades Empresariales" },
  { clave: "616", nombre: "Sin obligaciones fiscales" },
  { clave: "626", nombre: "Régimen Simplificado de Confianza" },
]
