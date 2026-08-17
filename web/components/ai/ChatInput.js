"use client"

import { useState } from "react"
import { SendHorizontal } from "lucide-react"

// Entrada del chat. Enter envía, Shift+Enter inserta salto de línea.
export default function ChatInput({
  onSubmit,
  disabled,
  placeholder = "Escribe tu mensaje…",
}) {
  const [text, setText] = useState("")

  function send() {
    const value = text.trim()
    if (!value || disabled) return
    onSubmit(value)
    setText("")
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="chat-input-row flex items-end gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={2}
        placeholder={placeholder}
        aria-label="Mensaje para el chat"
        className="textarea textarea-bordered chat-textarea max-h-32 min-h-[3.25rem] flex-1 resize-none bg-base-100 text-base leading-snug shadow-sm sm:max-h-40 sm:min-h-12"
      />
      <button
        type="button"
        onClick={send}
        disabled={disabled || !text.trim()}
        className="btn btn-primary btn-square min-h-[3.25rem] min-w-[3.25rem] touch-manipulation shrink-0"
        aria-label="Enviar mensaje"
      >
        {disabled ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          <SendHorizontal className="size-5" />
        )}
      </button>
    </div>
  )
}
