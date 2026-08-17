"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle, Brain, CheckCircle2 } from "lucide-react"
import Message from "./Message"
import ChatInput from "./ChatInput"
import { formatToolResult } from "@/lib/ai/toolResultFormat"

const TOOL_LABELS = {
  buscar_productos: "Busqué en tu inventario",
  gestionar_inventario: "Actualicé el producto",
  crear_producto: "Agregué el producto",
  ajustar_inventario: "Cambié el producto",
  registrar_venta: "Registré la venta",
  enviar_email: "Envié el correo",
}

const SUGGESTIONS = [
  "¿Cuánto stock hay del código 1001?",
  "Busca tornillos en mi inventario",
  "Vende 2 unidades del código 1001",
  "Agrega producto código 2050 nombre Tubo PVC precio 85 stock 20",
]

function FriendlyToolCard({ name, args, result }) {
  const label = TOOL_LABELS[name] ?? "Hice una acción en tu tienda"
  const summary = formatToolResult(name, result)
  const ok = result?.ok === true || (summary && !summary.startsWith("Error") && !summary.startsWith("No se"))

  return (
    <div
      className={`rounded-xl border p-3 text-sm ${
        ok
          ? "border-success/30 bg-success/5"
          : "border-warning/30 bg-warning/5"
      }`}
    >
      <div className="flex items-start gap-2">
        {ok ? (
          <CheckCircle2 className="size-5 shrink-0 text-success mt-0.5" />
        ) : (
          <Brain className="size-5 shrink-0 text-warning mt-0.5" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-base-content">{label}</p>
          {summary ? (
            <p className="mt-1 text-base-content/75 whitespace-pre-wrap text-sm leading-relaxed">
              {summary}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/**
 * Chat con inventario vía LangGraph (recover → decide → act).
 * Stream SSE desde POST /api/ai/agent.
 */
export default function LangGraphChat() {
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
        if (evt.text && evt.text !== "(ejecutando herramienta)") {
          setTimeline((prev) => [...prev, { kind: "reasoning", text: evt.text }])
        }
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
        return evt.message ?? "Error del asistente"
      default:
        break
    }

    return null
  }

  async function submitMessage(text) {
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

  async function handleSubmit(text) {
    setError(null)
    setStreaming(true)

    try {
      await submitMessage(text)
    } catch (err) {
      setError(
        err?.message
          ? `No pudimos completar la respuesta: ${err.message}`
          : "Algo salió mal. Revisa que OPENAI_API_KEY esté en .env.local e intenta de nuevo."
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
    <div className="chat-panel mobile-chat-panel flex min-h-0 flex-1 flex-col rounded-box border border-base-200 bg-base-100 shadow-sm md:min-h-[min(70vh,520px)] md:flex-none">
      <div
        ref={scrollRef}
        className="chat-messages min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:p-4"
      >
        {timeline.length === 0 ? (
          <div className="space-y-4 py-4">
            <p className="text-center text-sm text-base-content/65 px-2">
              Escríbeme como si le hablaras a un empleado. Puedo buscar
              productos, agregar al catálogo y registrar ventas por ti.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={streaming}
                  onClick={() => handleSubmit(s)}
                  className="btn btn-outline btn-sm rounded-full touch-manipulation min-h-10 text-xs sm:text-sm"
                >
                  {s}
                </button>
              ))}
            </div>
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
                  className="flex items-start gap-2 px-1 text-sm text-base-content/55"
                >
                  <Brain className="mt-0.5 size-4 shrink-0" />
                  <span className="whitespace-pre-wrap italic">{item.text}</span>
                </div>
              )
            }
            if (item.kind === "tool") {
              return (
                <FriendlyToolCard
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
            Estoy revisando tu tienda…
          </div>
        )}

        {error && (
          <div role="alert" className="alert alert-error">
            <AlertCircle className="size-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="chat-composer shrink-0 border-t border-base-200 bg-base-100 p-3 sm:p-4">
        <ChatInput
          onSubmit={handleSubmit}
          disabled={streaming}
          placeholder="Escribe aquí… Ej: ¿Cuánto hay del código 1001?"
        />
      </div>
    </div>
  )
}
