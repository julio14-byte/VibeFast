import { NextResponse } from "next/server"
import { createClient, getUser } from "@/lib/supabase/server"
import { searchProductos } from "@/lib/productos/search"
import { requireOrganizationId } from "@/lib/organization/context"

export async function GET(request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") ?? ""
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 12))
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0)

  const supabase = await createClient()
  let organizationId
  try {
    organizationId = await requireOrganizationId(supabase, user.id)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 403 })
  }

  const { productos, total, error } = await searchProductos(supabase, organizationId, {
    query,
    limit,
    offset,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, productos, total })
}
