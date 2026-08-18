/**
 * Parser CSV ligero + normalización de filas para importación masiva.
 */

const HEADER_ALIASES = {
  nombre: "nombre",
  producto: "nombre",
  descripcion: "nombre",
  titulo: "nombre",
  codigo: "codigo",
  sku: "codigo",
  cod: "codigo",
  precio: "precio_publico",
  precio_publico: "precio_publico",
  precio_publico_mxn: "precio_publico",
  precio_compra: "precio_compra",
  precio_mayoreo: "precio_mayoreo",
  stock: "stock",
  existencia: "stock",
  inventario: "stock",
  margen_ganancia: "margen_ganancia",
  margen: "margen_ganancia",
  margen_mayoreo: "margen_mayoreo",
  margen_may: "margen_mayoreo",
  clave_sat: "clave_sat",
  unidad_sat: "unidad_sat",
}

function normalizeHeader(raw) {
  const key = (raw || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
  return HEADER_ALIASES[key] ?? key
}

function parseCsvLine(line) {
  const result = []
  let cur = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === "," && !inQuotes) {
      result.push(cur)
      cur = ""
    } else {
      cur += ch
    }
  }
  result.push(cur)
  return result
}

export function parseCsv(text) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const lines = normalized.split("\n").filter((l) => l.trim())

  if (!lines.length) return []

  const headers = parseCsvLine(lines[0]).map(normalizeHeader)
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i])
    if (!cells.length || cells.every((c) => !String(c).trim())) continue

    const row = {}
    headers.forEach((h, idx) => {
      row[h] = cells[idx]?.trim() ?? ""
    })
    rows.push(row)
  }

  return rows
}

function parseNumber(raw, { integer = false } = {}) {
  if (raw == null || raw === "") return null
  const cleaned = String(raw).replace(/[$,\s]/g, "")
  const n = integer ? Number.parseInt(cleaned, 10) : Number.parseFloat(cleaned)
  if (!Number.isFinite(n)) return null
  return n
}

/**
 * Convierte una fila CSV normalizada a payload de producto.
 * @returns {{ ok: true, data } | { ok: false, error: string }}
 */
export function mapCsvRowToProducto(row, lineNumber) {
  const nombre = row.nombre?.trim()
  const codigo = row.codigo?.trim()

  if (!nombre || !codigo) {
    return {
      ok: false,
      error: `Línea ${lineNumber}: faltan nombre o código.`,
    }
  }

  const codigoNum = Number.parseInt(codigo, 10)
  if (!Number.isInteger(codigoNum) || codigoNum < 0) {
    return {
      ok: false,
      error: `Línea ${lineNumber}: el código debe ser un número entero.`,
    }
  }

  const precio_publico =
    parseNumber(row.precio_publico) ?? parseNumber(row.precio) ?? 0
  const stock = parseNumber(row.stock, { integer: true }) ?? 0

  if (precio_publico < 0 || stock < 0) {
    return {
      ok: false,
      error: `Línea ${lineNumber}: precio y stock deben ser >= 0.`,
    }
  }

  const precio_compra = parseNumber(row.precio_compra) ?? 0
  const precio_mayoreo = parseNumber(row.precio_mayoreo) ?? 0
  const margen_ganancia = parseNumber(row.margen_ganancia) ?? 30
  const margen_mayoreo =
    parseNumber(row.margen_mayoreo) ??
    Math.round(margen_ganancia * 0.85 * 10) / 10

  return {
    ok: true,
    data: {
      nombre,
      codigo: codigoNum,
      precio: precio_publico,
      precio_publico,
      precio_compra: precio_compra >= 0 ? precio_compra : 0,
      precio_mayoreo: precio_mayoreo >= 0 ? precio_mayoreo : 0,
      margen_ganancia: margen_ganancia >= 0 ? margen_ganancia : 30,
      margen_mayoreo: margen_mayoreo >= 0 ? margen_mayoreo : 0,
      stock,
      clave_sat: row.clave_sat?.trim() || "01010101",
      unidad_sat: row.unidad_sat?.trim() || "H87",
    },
  }
}

export const CSV_TEMPLATE = `nombre,codigo,precio_publico,precio_compra,precio_mayoreo,margen_ganancia,margen_mayoreo,stock,clave_sat,unidad_sat
Llave Stillson 20",2053,110.50,85.00,95.00,30,30,01010101,H87
Tornillo hexagonal 1/4,1001,2.50,1.20,1.80,30,500,01010101,H87
`
