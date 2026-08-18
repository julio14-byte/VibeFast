import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { timbrarCfdi } from "@/lib/pac/sandbox"
import { requireOrganizationId } from "@/lib/organization/context"

// API sandbox PAC — para integración futura con timbrado externo.
export async function POST(request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  let organizationId
  try {
    organizationId = await requireOrganizationId(supabase, user.id)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 403 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const facturaId = body?.factura_id
  if (!facturaId) {
    return NextResponse.json({ error: "factura_id requerido" }, { status: 400 })
  }

  const { data: factura } = await supabase
    .from("facturas")
    .select("*")
    .eq("id", facturaId)
    .eq("organization_id", organizationId)
    .single()

  if (!factura) {
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
  }

  const { data: empresa } = await supabase
    .from("empresa_fiscal")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle()

  const timbre = await timbrarCfdi({
    xml: factura.xml_cfdi,
    empresa,
  })

  if (!timbre.ok) {
    return NextResponse.json({ error: timbre.error }, { status: 502 })
  }

  await supabase
    .from("facturas")
    .update({
      estado: "timbrada",
      uuid_cfdi: timbre.uuid_cfdi,
      xml_cfdi: timbre.xml_timbrado ?? factura.xml_cfdi,
      pac_response: timbre.pac_response,
      timbrado_at: new Date().toISOString(),
    })
    .eq("id", facturaId)
    .eq("organization_id", organizationId)

  return NextResponse.json({
    ok: true,
    uuid_cfdi: timbre.uuid_cfdi,
    sandbox: timbre.sandbox ?? false,
  })
}
