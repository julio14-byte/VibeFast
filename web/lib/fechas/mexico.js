/** Límites UTC para un día calendario en Ciudad de México (UTC−6, sin horario de verano). */

export function formatDateInput(date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" })
}

export function mexicoDayBounds(fecha) {
  const day = fecha?.trim() || formatDateInput()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new Error("Fecha inválida. Use AAAA-MM-DD.")
  }

  const [y, m, d] = day.split("-").map(Number)
  const desde = new Date(Date.UTC(y, m - 1, d, 6, 0, 0, 0))
  const hasta = new Date(Date.UTC(y, m - 1, d + 1, 5, 59, 59, 999))

  return { fecha: day, desde: desde.toISOString(), hasta: hasta.toISOString() }
}

export function formatFechaMexico(iso) {
  return new Date(iso).toLocaleDateString("es-MX", {
    timeZone: "America/Mexico_City",
    dateStyle: "medium",
  })
}
