// ============================================================
// POST /api/ai/agent
// ------------------------------------------------------------
// Body:  { messages: [{ role, content }], conversationId?: string }
// Resp:  stream SSE (text/event-stream). Cada evento es una línea
//        `data: {json}\n\n` con json de la forma:
//          { type: "reasoning", text }
//          { type: "tool_call", name, args, result }
//          { type: "token",     text }
//          { type: "done" }
//          { type: "error",     message }   (si algo falla a media corrida)
//        400 si `messages` no es un array no vacío.
//
// Corre el agente recover→decide→act (LangGraph). Cada tool call se
// persiste vía logToolCall (Session A), best-effort dentro del agente.
// ============================================================

import { NextResponse, after } from "next/server"
import { getUser } from "@/lib/supabase/server"
import config from "@/config"
import { runRecoverDecideAct } from "@/lib/agents/examples/recoverDecideAct.js"
import { persistChatExchange } from "@/lib/ai/persistConversation"

export async function POST(request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para usar el agente." },
        { status: 401 }
      )
    }

    if (!config.features.agents) {
      return NextResponse.json(
        { error: "Los agentes LangGraph están desactivados en config.features.agents." },
        { status: 503 }
      )
    }

    const { messages, conversationId } = await request.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages debe ser un array no vacío." },
        { status: 400 }
      )
    }

    const lastUserMessage = messages[messages.length - 1]
    let assistantText = ""

    const encoder = new TextEncoder()
    const events = runRecoverDecideAct({ messages, conversationId })

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        try {
          for await (const event of events) {
            if (event.type === "token" && event.text) {
              assistantText += event.text
            }
            send(event)
          }
        } catch (err) {
          send({ type: "error", message: err?.message ?? "fallo del agente" })
        } finally {
          controller.close()
          after(async () => {
            try {
              await persistChatExchange({
                conversationId,
                userMessage: lastUserMessage,
                assistantText,
              })
            } catch (err) {
              console.error("[ai/agent] persistencia omitida:", err?.message)
            }
          })
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: "Error procesando la solicitud." },
      { status: 500 }
    )
  }
}
