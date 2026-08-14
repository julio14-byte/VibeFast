import { redirect } from "next/navigation"

export const metadata = { title: "Asistente · SmartPOS" }

/** El asistente LangGraph vive en /chat (misma experiencia). */
export default function AgentPage() {
  redirect("/chat")
}
