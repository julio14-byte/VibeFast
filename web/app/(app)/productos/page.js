import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { getProductosPage } from "@/lib/productos/queries"
import ProductCsvImport from "@/components/productos/ProductCsvImport"
import ProductosCrud from "@/components/productos/ProductosCrud"

export const metadata = { title: "Productos · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function ProductosPage({ searchParams }) {
  const params = await searchParams
  const page = Number(params?.page) || 1
  const query = typeof params?.q === "string" ? params.q.trim() : ""
  const formError = params?.error?.toString()
  const ok = params?.ok?.toString()
  const importCreados = params?.creados?.toString()
  const importActualizados = params?.actualizados?.toString()
  const importErrores = params?.errores?.toString()

  let productos = []
  let pagination = { page: 1, totalPages: 1, total: 0 }
  let error = null

  if (!isSupabaseConfigured()) {
    error = { message: "Supabase no está configurado." }
  } else {
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        error = { message: "No autenticado." }
      } else {
        const pageRes = await getProductosPage(supabase, user.id, { page, query })

        productos = pageRes.productos
        pagination = {
          page: pageRes.page,
          totalPages: pageRes.totalPages,
          total: pageRes.total,
        }
        error = pageRes.error
      }
    } catch (err) {
      error = { message: err.message }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Productos</h1>
          <p className="page-lead">
            Catálogo con búsqueda SAT, margen de ganancia y precios con IVA en
            venta. Compra sin IVA.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/inventario"
            className="btn btn-outline btn-sm touch-manipulation"
          >
            Inventario
          </Link>
        </div>
      </div>

      {formError && (
        <div role="alert" className="alert alert-error">
          <span>{formError}</span>
        </div>
      )}
      {ok === "importado" && (
        <div role="alert" className="alert alert-success">
          <span>
            Importación completada: {importCreados ?? 0} creados,{" "}
            {importActualizados ?? 0} actualizados
            {importErrores && Number(importErrores) > 0
              ? `, ${importErrores} filas omitidas`
              : ""}
            .
          </span>
        </div>
      )}
      {ok && ok !== "importado" && !formError && (
        <div role="alert" className="alert alert-success">
          <span>
            {ok === "creado" && "Producto agregado."}
            {ok === "actualizado" && "Producto actualizado."}
            {ok === "eliminado" && "Producto eliminado."}
          </span>
        </div>
      )}

      <ProductCsvImport />

      {error && (
        <div className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          {error.message}
        </div>
      )}

      {!pagination.total && !query ? (
        <div className="space-y-4">
          <div className="rounded-box border border-dashed border-base-300 bg-base-100 px-4 py-12 text-center text-base-content/60">
            Sin productos. Usa <strong>Nuevo producto</strong>, importa un CSV o el{" "}
            <Link href="/chat" className="link link-primary">chat</Link>.
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
