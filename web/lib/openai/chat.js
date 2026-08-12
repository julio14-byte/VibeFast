// ============================================================
// OpenAI · chat con streaming
// ------------------------------------------------------------
// streamChat() abre el stream de OpenAI y devuelve un
// ReadableStream de texto plano, listo para un Response en un
// Route Handler.
//
// Es async a propósito: la llamada a OpenAI se hace ANTES de
// construir el ReadableStream. Así un fallo temprano (key ausente,
// 401, red) rechaza la promesa y la route lo atrapa con un error
// controlado, en vez de romper a mitad del pipe. Los errores que
// ocurren ya empezado el stream sí van a controller.error.
//
// onToken (opcional) se invoca con cada fragmento de texto — útil
// para acumular la respuesta completa y persistirla.
// ============================================================

import { openai } from "./client"
import { getAiModel } from "./provider"
import config from "@/config"

// messages: [{ role, content }] · opts: { model?, onToken? }
// Devuelve un ReadableStream que emite el texto a medida que llega.
export async function streamChat(messages, { model = config.ai.chatModel, onToken } = {}) {
  const completion = await openai.chat.completions.create({
    model: getAiModel(model),
    messages,
    max_tokens: config.ai.maxTokens,
    temperature: config.ai.temperature,
    stream: true,
  })

  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content
          if (!text) continue
          if (onToken) onToken(text)
          controller.enqueue(encoder.encode(text))
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })
}
