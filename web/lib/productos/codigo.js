/** Normaliza y valida código de producto (alfanumérico). */
export function normalizeCodigo(raw) {
  const codigo = String(raw ?? "").trim()
  if (!codigo) return null
  if (codigo.length > 64) return null
  if (!/^[A-Za-z0-9._-]+$/.test(codigo)) return null
  return codigo
}

export function codigoValidationError(codigo) {
  if (!codigo?.trim()) return "El código es obligatorio."
  if (codigo.length > 64) return "El código no puede superar 64 caracteres."
  if (!/^[A-Za-z0-9._-]+$/.test(codigo)) {
    return "El código solo puede usar letras, números, punto, guion y guion bajo."
  }
  return null
}
