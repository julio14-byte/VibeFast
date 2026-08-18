import { createClient } from "@/lib/supabase/server"
import InventarioClient from "@/components/inventario/InventarioClient"
import CatalogoNav from "@/components/catalogo/CatalogoNav"
import { formatError } from "@/lib/errors"
import { getAlertasStockCount, getProductosPage } from "@/lib/productos/queries"
import { getMembershipForUser } from "@/lib/organization/context"

export const metadata = { title: "Inventario · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function InventarioPage({ searchParams }) {
  const params = await searchParams
  const page = Number(params?.page) || 1
  const query = typeof params?.q === "string" ? params.q.trim() : ""

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div role="alert" className="alert alert-error">
        <span>Debes iniciar sesión.</span>
      </div>
    )
  }

  const membership = await getMembershipForUser(supabase, user.id)
  const organizationId = membership?.organizationId ?? user.id

  const [pageRes, alertasRes] = await Promise.all([
    getProductosPage(supabase, organizationId, { page, query }),
    getAlertasStockCount(supabase, organizationId),
  ])

  if (pageRes.error) {
    return (
      <div role="alert" className="alert alert-error">
        <span>No pudimos cargar el inventario: {formatError(pageRes.error)}</span>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <CatalogoNav />
      <InventarioClient
        productos={pageRes.productos}
        alertasCount={alertasRes.count ?? 0}
        page={pageRes.page}
        totalPages={pageRes.totalPages}
        total={pageRes.total}
        query={query}
      />
    </div>
  )
}
