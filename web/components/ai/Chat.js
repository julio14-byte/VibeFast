"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle, Brain } from "lucide-react"
import Message from "./Message"
import ChatInput from "./ChatInput"
import ToolCallCard from "./ToolCallCard"

/**
 * Chat con inventario.
 * - langGraph=true: POST /api/ai/agent (LangGraph recover→decide→act, SSE)
 * - langGraph=false: POST /api/ai/chat (texto plano)
 */
export default function Chat({ langGraph = false }) {
  const [timeline, setTimeline] = useState([])
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [timeline])

  function appendToken(text) {
    setTimeline((prev) => {
      const next = [...prev]
      const last = next[next.length - 1]
      if (last?.kind === "answer") {
        next[next.length - 1] = { ...last, text: last.text + text }
      } else {
        next.push({ kind: "answer", text })
      }
      return next
    })
  }

  function handleAgentEvent(rawEvent) {
    const data = rawEvent
      .split("\n")
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trim())
      .join("")
    if (!data || data === "[DONE]") return null

    let evt
    try {
      evt = JSON.parse(data)
    } catch {
      return null
    }

    switch (evt.type) {
      case "reasoning":
        setTimeline((prev) => [...prev, { kind: "reasoning", text: evt.text }])
        break
      case "tool_call":
        setTimeline((prev) => [
          ...prev,
          { kind: "tool", name: evt.name, args: evt.args, result: evt.result },
        ])
        break
      case "token":
        appendToken(evt.text || "")
        break
      case "error":
        return evt.message ?? "Error del agente"
      default:
        break
    }

    return null
  }

  async function submitLangGraph(text) {
    const withUser = [...timeline, { kind: "user", content: text }]
    setTimeline(withUser)

    const messages = withUser
      .filter((i) => i.kind === "user" || i.kind === "answer")
      .map((i) =>
        i.kind === "user"
          ? { role: "user", content: i.content }
          : { role: "assistant", content: i.text }
      )

    const res = await fetch("/api/ai/agent", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    })

    if (!res.ok || !res.body) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.error || `El servidor respondió ${res.status}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let idx
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const errMsg = handleAgentEvent(buffer.slice(0, idx))
        if (errMsg) throw new Error(errMsg)
        buffer = buffer.slice(idx + 2)
      }
    }
    if (buffer.trim()) {
      const errMsg = handleAgentEvent(buffer)
      if (errMsg) throw new Error(errMsg)
    }
  }

  async function submitPlainChat(text) {
    const userMessage = { role: "user", content: text }
    const history = timeline
      .filter((i) => i.kind === "user" || i.kind === "answer")
      .map((i) =>
        i.kind === "user"
          ? { role: "user", content: i.content }
          : { role: "assistant", content: i.text }
      )

    const messages = [...history, userMessage]
    setTimeline((prev) => [
      ...prev,
      { kind: "user", content: text },
      { kind: "answer", text: "" },
    ])

    const res = await fetch("/api/ai/chat", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    })

    if (!res.ok || !res.body) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.error || `El servidor respondió ${res.status}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      appendToken(chunk)
    }
  }

  async function handleSubmit(text) {
    setError(null)
    setStreaming(true)

    try {
      if (langGraph) {
        await submitLangGraph(text)
      } else {
        await submitPlainChat(text)
      }
    } catch (err) {
      if (!langGraph) {
        setTimeline((prev) => {
          const last = prev[prev.length - 1]
          if (last?.kind === "answer" && last.text === "") {
            return prev.slice(0, -1)
          }
          return prev
        })
      }
      setError(
        err?.message
          ? `No pudimos completar la respuesta: ${err.message}`
          : "Algo salió mal al contactar al asistente. Intenta de nuevo."
      )
    } finally {
      setStreaming(false)
    }
  }

  const isWaiting =
    streaming &&
    (timeline.length === 0 ||
      timeline[timeline.length - 1]?.kind === "user" ||
      (timeline[timeline.length - 1]?.kind === "answer" &&
        timeline[timeline.length - 1]?.text === ""))

  return (
    <div className="flex h-[70vh] flex-col rounded-box border border-base-200 bg-base-100">
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
        {timeline.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-base-content/60">
            {langGraph
              ? "Pregunta por inventario, ventas o precios. El agente LangGraph elegirá las herramientas."
              : "Empieza la conversación escribiendo un mensaje abajo."}
          </div>
        ) : (
          timeline.map((item, i) => {
            if (item.kind === "user") {
              return <Message key={i} role="user" content={item.content} />
            }
            if (item.kind === "answer") {
              if (!item.text) return null
              return <Message key={i} role="assistant" content={item.text} />
            }
            if (item.kind === "reasoning") {
              return (
                <div
                  key={i}
                  className="flex items-start gap-2 px-1 text-sm italic text-base-content/60"
                >
                  <Brain className="mt-0.5 size-4 shrink-0" />
                  <span className="whitespace-pre-wrap">{item.text}</span>
                </div>
              )
            }
            if (item.kind === "tool") {
              return (
                <ToolCallCard
                  key={i}
                  name={item.name}
                  args={item.args}
                  result={item.result}
                />
              )
            }
            return null
          })
        )}

        {isWaiting && (
          <div className="flex items-center gap-2 px-1 text-sm text-base-content/50">
            <span className="loading loading-dots loading-sm" />
            {langGraph ? "El agente LangGraph está trabajando…" : "Pensando…"}
          </div>
        )}

        {error && (
          <div role="alert" className="alert alert-error">
            <AlertCircle className="size-5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="border-t border-base-200 p-4">
        <ChatInput onSubmit={handleSubmit} disabled={streaming} />
      </div>
    </div>
  )
}
