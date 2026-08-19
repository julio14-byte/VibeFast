import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { buildTicketData } from "@/lib/ticket"
import TicketView from "@/components/ventas/TicketView"
import { getMembershipForUser } from "@/lib/organization/context"

export const metadata = { title: "Ticket · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function TicketPage({
  params,
  searchParams,
}) {
  const { id } = await params
  const sp = await searchParams
  const autoPrint = sp?.print === "1"

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  const membership = await getMembershipForUser(supabase, user.id)
  if (!membership?.organizationId) notFound()

  const { data: venta } = await supabase
    .from("ventas")
    .select("*, items:venta_items(*), cliente:clientes(*)")
    .eq("id", id)
    .eq("organization_id", membership.organizationId)
    .single()

  if (!venta) notFound()

  const { data: empresa } = await supabase
    .from("empresa_fiscal")
    .select("razon_social, nombre_comercial, rfc, direccion, telefono, ticket_mensaje_pie, ticket_texto_extra, ticket_mostrar_rfc, ticket_mostrar_direccion, ticket_mostrar_telefono, ticket_mostrar_cliente, ticket_mostrar_iva, ticket_mostrar_forma_pago")
    .eq("organization_id", membership.organizationId)
    .maybeSingle()

  const ticket = buildTicketData({
    venta,
    items: venta.items ?? [],
    empresa,
    cliente: venta.cliente,
  })

  if (autoPrint && !venta.ticket_impreso) {
    await supabase
      .from("ventas")
      .update({
        ticket_impreso: true,
        ticket_impreso_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", membership.organizationId)
  }

  return (
    <div className="ticket-page mx-auto max-w-lg py-4">
      <TicketView ticket={ticket} autoPrint={autoPrint} />
    </div>
  )
}
