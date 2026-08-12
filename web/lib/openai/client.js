// ============================================================
// OpenAI · cliente compartido
// ------------------------------------------------------------
// Soporta dos modos (server-only, nunca en el browser):
//   · OpenAI directo  → OPENAI_API_KEY
//   · Cursor vía proxy → CURSOR_API_KEY + CURSOR_API_BASE_URL
//
// El cliente se construye de forma perezosa (Proxy) para que
// `next build` no falle si aún no hay keys en .env.local.
// ============================================================

import OpenAI from "openai"

let client = null

function getClientConfig() {
  const cursorKey = process.env.CURSOR_API_KEY?.trim()
  if (cursorKey) {
    const baseURL = process.env.CURSOR_API_BASE_URL?.trim()
    if (!baseURL) {
      throw new Error(
        "CURSOR_API_BASE_URL es obligatorio con CURSOR_API_KEY. " +
          "Cursor no tiene chat/completions público: usa un proxy local " +
          "(ej. http://localhost:3457/v1). Mira web/.env.example."
      )
    }
    return { apiKey: cursorKey, baseURL }
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim()
  if (!openaiKey) {
    throw new Error(
      "Falta OPENAI_API_KEY o CURSOR_API_KEY en web/.env.local."
    )
  }

  const config = { apiKey: openaiKey }
  const baseURL = process.env.OPENAI_BASE_URL?.trim()
  if (baseURL) config.baseURL = baseURL
  return config
}

function getClient() {
  if (!client) {
    client = new OpenAI(getClientConfig())
  }
  return client
}

export const openai = new Proxy(
  {},
  {
    get(_target, prop) {
      const value = getClient()[prop]
      return typeof value === "function" ? value.bind(getClient()) : value
    },
  }
)
