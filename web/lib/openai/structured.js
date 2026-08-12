// ============================================================
// OpenAI · structured outputs
// ------------------------------------------------------------
// generateObject() fuerza a la IA a devolver un objeto que
// cumple un schema de Zod. Con OpenAI usa beta.chat.completions.parse;
// con Cursor (proxy) usa chat.completions.create + validación Zod.
// ============================================================

import { zodResponseFormat } from "openai/helpers/zod"
import { openai } from "./client"
import { getAiModel, usesCursor } from "./provider"
import config from "@/config"

// schema: ZodSchema · prompt: string · model: opcional (override)
// Devuelve el objeto ya validado contra `schema`.
export async function generateObject(
  schema,
  prompt,
  model = config.ai.structuredModel
) {
  const responseFormat = zodResponseFormat(schema, "result")
  const resolvedModel = getAiModel(model)

  if (usesCursor()) {
    const completion = await openai.chat.completions.create({
      model: resolvedModel,
      messages: [{ role: "user", content: prompt }],
      response_format: responseFormat,
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) {
      throw new Error("La IA no devolvió contenido.")
    }

    return schema.parse(JSON.parse(raw))
  }

  const completion = await openai.beta.chat.completions.parse({
    model: resolvedModel,
    messages: [{ role: "user", content: prompt }],
    response_format: responseFormat,
  })

  return completion.choices[0].message.parsed
}
