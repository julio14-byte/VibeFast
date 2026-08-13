import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const { data: factura } = await supabase
    .from("facturas")
    .select("serie, folio, xml_cfdi")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!factura?.xml_cfdi) {
    return NextResponse.json({ error: "CFDI no encontrado" }, { status: 404 })
  }

  const filename = `CFDI_${factura.serie}-${factura.folio}.xml`

  return new NextResponse(factura.xml_cfdi, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
