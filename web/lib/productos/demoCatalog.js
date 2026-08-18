/** Productos de ejemplo de la plantilla CSV / pruebas iniciales. */
export const DEMO_PRODUCT_CODIGOS = new Set([
  "llav-2053",
  "torn-1001",
  "2053",
  "1001",
])

const DEMO_NAME_PATTERNS = [
  /^llave stillson/i,
  /^tornillo hexagonal/i,
]

export function isDemoProducto({ codigo, nombre } = {}) {
  const codeKey = String(codigo ?? "")
    .trim()
    .toLowerCase()
  if (codeKey && DEMO_PRODUCT_CODIGOS.has(codeKey)) return true

  const name = String(nombre ?? "").trim()
  return DEMO_NAME_PATTERNS.some((pattern) => pattern.test(name))
}

export function filterDemoProductos(productos = []) {
  return productos.filter(isDemoProducto)
}
