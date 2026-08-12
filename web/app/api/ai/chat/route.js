// ============================================================
// POST /api/ai/chat
// ------------------------------------------------------------
// Body:  { messages: [{ role, content }], conversationId?: string }
// Resp:  stream de texto plano (text/plain; charset=utf-8).
//        400 si `messages` no es un array no vacío.
//
// Persistencia (best-effort, Fase 4 / Session A): si hay usuario
// autenticado, guarda el último mensaje del usuario + la respuesta
// del assistant en ai_conversations / ai_messages. Va envuelta en
// try/catch y corre con after() — si las tablas o el usuario no
// existen todavía, el stream se responde igual.
// ============================================================

import { NextResponse, after } from "next/server"
import { createClient, getUser } from "@/lib/supabase/server"
import { streamChat } from "@/lib/openai/chat"

export async function POST(request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para usar el chat con inventario." },
        { status: 401 }
      )
    }

    const { messages, conversationId } = await request.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages debe ser un array no vacío." },
        { status: 400 }
      )
    }

    // Acumula la respuesta para persistirla cuando el stream termine.
    // Si OpenAI falla al abrir el stream (key ausente, 401, red), el
    // await rechaza y cae al catch de abajo → error JSON controlado.
    let assistantText = ""
    const stream = await streamChat(messages, {
      useTools: true,
      conversationId,
      onToken: (token) => {
        assistantText += token
      },
    })

    // Corre después de enviar la respuesta. No bloquea el stream y
    // nunca lo rompe: cualquier fallo de persistencia se ignora.
    after(async () => {
      try {
        const user = await getUser()
        if (!user) return

        const supabase = await createClient()

        let convId = conversationId
        if (!convId) {
          const { data, error } = await supabase
            .from("ai_conversations")
            .insert({ user_id: user.id })
            .select("id")
            .single()
          if (error || !data) return
          convId = data.id
        }

        const lastUserMessage = messages[messages.length - 1]
        await supabase.from("ai_messages").insert([
          {
            conversation_id: convId,
            role: lastUserMessage.role,
            content: lastUserMessage.content,
          },
          { conversation_id: convId, role: "assistant", content: assistantText },
        ])
      } catch (err) {
        console.error("[ai/chat] persistencia omitida:", err?.message)
      }
    })

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  } catch (err) {
    return NextResponse.json(
      { error: "Error procesando la solicitud." },
      { status: 500 }
    )
  }
}
