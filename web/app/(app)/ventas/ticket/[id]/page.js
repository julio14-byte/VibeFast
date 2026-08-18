import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { buildTicketData } from "@/lib/ticket"
import TicketView from "@/components/ventas/TicketView"
import { marcarTicketImpreso } from "../../actions"
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
    .select("razon_social, rfc, direccion")
    .eq("organization_id", membership.organizationId)
    .maybeSingle()

  const ticket = buildTicketData({
    venta,
    items: venta.items ?? [],
    empresa,
    cliente: venta.cliente,
  })

  if (autoPrint && !venta.ticket_impreso) {
    await marcarTicketImpreso(id)
  }

  return (
    <div className="mx-auto max-w-lg py-4">
      <TicketView ticket={ticket} autoPrint={autoPrint} />
    </div>
  )
}
