/** Normaliza errores de Supabase u otros para mostrar en UI (evita React error #31). */
export function formatError(error) {
  if (!error) return ""
  if (typeof error === "string") return error
  if (typeof error.message === "string") return error.message
  try {
    return JSON.stringify(error)
  } catch {
    return "Error desconocido."
  }
}
