// ============================================================
// Proveedor de IA · OpenAI vs Cursor
// ------------------------------------------------------------
// Cursor no expone chat/completions en api.cursor.com.
// Con CURSOR_API_KEY debes apuntar CURSOR_API_BASE_URL a un
// proxy OpenAI-compatible local (ver web/.env.example).
// ============================================================

import config from "@/config"

export function usesCursor() {
  return Boolean(process.env.CURSOR_API_KEY?.trim())
}

export function getAiModel(fallback = config.ai.structuredModel) {
  if (usesCursor()) {
    return process.env.CURSOR_MODEL?.trim() || config.ai.cursorModel
  }
  return fallback
}
