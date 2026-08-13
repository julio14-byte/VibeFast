"use client"

import { Mail, MessageCircle } from "lucide-react"
import {
  enviarCfdiPorEmail,
  enviarCfdiPorWhatsApp,
} from "@/app/(app)/facturacion/actions"

export default function EnviarCfdiButtons({
  facturaId,
  defaultEmail = "",
  defaultTelefono = "",
}) {
  return (
    <div className="flex flex-col gap-2 min-w-[200px]">
      <form action={enviarCfdiPorEmail} className="flex gap-1 items-center">
        <input type="hidden" name="factura_id" value={facturaId} />
        <input
          name="email"
          type="email"
          placeholder="Email cliente"
          defaultValue={defaultEmail}
          className="input input-bordered input-xs flex-1 min-w-0"
          aria-label="Email para CFDI"
        />
        <button
          type="submit"
          className="btn btn-ghost btn-xs btn-square"
          title="Enviar por email"
          aria-label="Enviar CFDI por email"
        >
          <Mail className="size-3.5" />
        </button>
      </form>
      <form action={enviarCfdiPorWhatsApp} className="flex gap-1 items-center">
        <input type="hidden" name="factura_id" value={facturaId} />
        <input
          name="telefono"
          type="tel"
          placeholder="WhatsApp +52…"
          defaultValue={defaultTelefono}
          className="input input-bordered input-xs flex-1 min-w-0"
          aria-label="WhatsApp"
        />
        <button
          type="submit"
          className="btn btn-ghost btn-xs btn-square text-success"
          title="Enviar por WhatsApp"
          aria-label="Enviar CFDI por WhatsApp"
        >
          <MessageCircle className="size-3.5" />
        </button>
      </form>
    </div>
  )
}
