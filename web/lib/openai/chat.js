// ============================================================
// OpenAI · chat con inventario vía LangGraph
// ============================================================

import { openai } from "./client"
import { getAiModel } from "./provider"
import config from "@/config"
import { runRecoverDecideAct } from "@/lib/agents/examples/recoverDecideAct.js"
import { formatChatEvent } from "@/lib/ai/toolResultFormat.js"

function textStream(text, onToken) {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      if (text) {
        if (onToken) onToken(text)
        controller.enqueue(encoder.encode(text))
      }
      controller.close()
    },
  })
}

async function streamChatViaLangGraph(messages, { onToken, conversationId }) {
  let text = ""
  for await (const event of runRecoverDecideAct({ messages, conversationId })) {
    if (event.type === "error") {
      throw new Error(event.message ?? "Error del agente LangGraph")
    }
    const chunk = formatChatEvent(event)
    if (chunk && onToken) onToken(chunk)
    text += chunk
  }

  return textStream(text.trim(), onToken)
}

export async function streamChat(
  messages,
  { model = config.ai.chatModel, onToken, conversationId, useTools = false } = {}
) {
  if (useTools && config.features.toolUse && config.features.agents) {
    return streamChatViaLangGraph(messages, { onToken, conversationId })
  }

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

export { formatToolResult, formatChatEvent } from "@/lib/ai/toolResultFormat.js"
