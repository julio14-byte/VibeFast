import { createClient } from "@/lib/supabase/server"

/**
 * Guarda el último mensaje del usuario y la respuesta del asistente (best-effort).
 */
export async function persistChatExchange({
  conversationId,
  userMessage,
  assistantText,
}) {
  if (!userMessage?.content?.trim()) return null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  let convId = conversationId
  if (!convId) {
    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({ user_id: user.id })
      .select("id")
      .single()
    if (error || !data) return null
    convId = data.id
  }

  const rows = [
    {
      conversation_id: convId,
      role: userMessage.role ?? "user",
      content: userMessage.content,
    },
  ]

  if (assistantText?.trim()) {
    rows.push({
      conversation_id: convId,
      role: "assistant",
      content: assistantText.trim(),
    })
  }

  await supabase.from("ai_messages").insert(rows)
  return convId
}
