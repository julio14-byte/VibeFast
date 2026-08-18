import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { getProductosPage } from "@/lib/productos/queries"
import { getMembershipForUser } from "@/lib/organization/context"
import { formatError } from "@/lib/errors"
import PageHeader from "@/components/ui/PageHeader"
import CatalogoNav from "@/components/catalogo/CatalogoNav"
import ProductosCrud from "@/components/productos/ProductosCrud"

export const metadata = { title: "Productos · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function ProductosPage({ searchParams }) {
  const params = await searchParams
  const page = Number(params?.page) || 1
  const query = typeof params?.q === "string" ? params.q.trim() : ""
  const formError = params?.error?.toString()
  const ok = params?.ok?.toString()

  let productos = []
  let pagination = { page: 1, totalPages: 1, total: 0 }
  let error = null

  if (!isSupabaseConfigured()) {
    error = "Supabase no está configurado."
  } else {
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        error = "No autenticado."
      } else {
        const membership = await getMembershipForUser(supabase, user.id)
        const pageRes = await getProductosPage(
          supabase,
          membership?.organizationId ?? user.id,
          { page, query }
        )

        productos = pageRes.productos
        pagination = {
          page: pageRes.page,
          totalPages: pageRes.totalPages,
          total: pageRes.total,
        }
        error = pageRes.error
      }
    } catch (err) {
      error = formatError(err)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        lead="Lista de todo lo que vendes. Usa «Nuevo producto» para agregar uno o el lápiz para cambiar precios."
        tip="Para cargar muchos productos de una vez, ve a Configuración en el menú e importa tu archivo Excel/CSV."
        actions={
          <Link
            href="/settings"
            className="btn btn-outline btn-sm touch-manipulation min-h-11"
          >
            Importar lista
          </Link>
        }
      />

      <CatalogoNav />

      {formError && (
        <div role="alert" className="alert alert-error">
          <span>{formError}</span>
        </div>
      )}
      {ok && !formError && (
        <div role="alert" className="alert alert-success">
          <span>
            {ok === "creado" && "Producto guardado correctamente."}
            {ok === "actualizado" && "Cambios guardados."}
            {ok === "eliminado" && "Producto eliminado."}
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {!pagination.total && !query ? (
        <div className="space-y-4">
          <div className="rounded-box border border-dashed border-base-300 bg-base-100 px-4 py-12 text-center text-base-content/60">
            Aún no hay productos. Pulsa <strong>Nuevo producto</strong> abajo,
            importa en{" "}
            <Link href="/settings" className="link link-primary">
              Configuración
            </Link>{" "}
            o pide ayuda en el <Link href="/chat" className="link link-primary">Chat</Link>.
          </div>
          <ProductosCrud
            productos={[]}
            pagination={pagination}
            query={query}
          />
        </div>
      ) : (
        <ProductosCrud
          productos={productos}
          pagination={pagination}
          query={query}
        />
      )}
    </div>
  )
}
