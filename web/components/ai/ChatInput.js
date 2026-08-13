"use client"

import { useState } from "react"
import { SendHorizontal } from "lucide-react"

// Entrada del chat. Enter envía, Shift+Enter inserta salto de línea.
// Se deshabilita mientras el assistant está respondiendo (disabled).
export default function ChatInput({ onSubmit, disabled }) {
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
    <div className="flex items-end gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        placeholder="Escribe tu mensaje…"
        className="textarea textarea-bordered max-h-32 min-h-11 flex-1 resize-none text-base sm:max-h-40 sm:min-h-12"
      />
      <button
        type="button"
        onClick={send}
        disabled={disabled || !text.trim()}
        className="btn btn-primary btn-square min-h-11 min-w-11 touch-manipulation"
        aria-label="Enviar"
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
