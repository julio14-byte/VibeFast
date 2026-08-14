import { NextResponse } from "next/server"
import { getUser } from "@/lib/supabase/server"
import { searchClaveProdServ } from "@/lib/sat/catalog-cache"

export async function GET(request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") ?? ""
  const limit = Math.min(30, Math.max(1, Number(searchParams.get("limit")) || 15))

  try {
    const resultados = await searchClaveProdServ(q, limit)
    return NextResponse.json({ ok: true, resultados })
  } catch (err) {
    return NextResponse.json(
      { error: err?.message ?? "No se pudo consultar el catálogo SAT." },
      { status: 500 }
    )
  }
}
