import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { formatPrecio } from "@/lib/productos"
import { getProductosPage } from "@/lib/productos/queries"
import {
  createProducto,
  updateProducto,
  deleteProducto,
} from "./actions"
import ProductCsvImport from "@/components/productos/ProductCsvImport"
import ProductosPagination, {
  ProductosTable,
} from "@/components/productos/ProductosList"

export const metadata = { title: "Productos · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function ProductosPage({ searchParams }) {
  const params = await searchParams
  const page = Number(params?.page) || 1
  const query = typeof params?.q === "string" ? params.q.trim() : ""
  const editId = params?.edit?.toString()
  const formError = params?.error?.toString()
  const ok = params?.ok?.toString()
  const importCreados = params?.creados?.toString()
  const importActualizados = params?.actualizados?.toString()
  const importErrores = params?.errores?.toString()

  let productos = []
  let proveedores = []
  let pagination = { page: 1, totalPages: 1, total: 0 }
  let editProducto = null
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
        const [pageRes, proveedoresRes] = await Promise.all([
          getProductosPage(supabase, user.id, { page, query }),
          supabase.from("proveedores").select("id, nombre").order("nombre"),
        ])

        productos = pageRes.productos
        pagination = {
          page: pageRes.page,
          totalPages: pageRes.totalPages,
          total: pageRes.total,
        }
        error = pageRes.error
        proveedores = proveedoresRes.data ?? []

        if (editId) {
          const { data: editRow } = await supabase
            .from("productos")
            .select("*, proveedor:proveedores(id, nombre)")
            .eq("id", editId)
            .eq("user_id", user.id)
            .maybeSingle()
          editProducto = editRow
        }
      }
    } catch (err) {
      error = { message: err.message }
    }
  }

  function listHref(extra = {}) {
    const sp = new URLSearchParams()
    if (query) sp.set("q", query)
    if (extra.page && extra.page > 1) sp.set("page", String(extra.page))
    const qs = sp.toString()
    return qs ? `/productos?${qs}` : "/productos"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Productos</h1>
          <p className="page-lead">
            Catálogo con paginación, búsqueda y importación CSV masiva.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href="/proveedores" className="btn btn-outline btn-sm touch-manipulation">
            Proveedores
          </Link>
          <Link href="/inventario" className="btn btn-outline btn-sm touch-manipulation">
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

      <form
        action={listHref()}
        method="get"
        className="flex flex-wrap items-center gap-2"
      >
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Buscar por nombre o código…"
          className="input input-bordered input-sm w-full max-w-xs"
          aria-label="Buscar productos"
        />
        <button type="submit" className="btn btn-outline btn-sm touch-manipulation">
          Buscar
        </button>
        {query && (
          <Link href="/productos" className="btn btn-ghost btn-sm touch-manipulation">
            Limpiar
          </Link>
        )}
      </form>

      <form
        action={editProducto ? updateProducto : createProducto}
        className="rounded-box border border-base-200 bg-base-100 p-4"
      >
        {editProducto && (
          <input type="hidden" name="id" value={editProducto.id} />
        )}

        <p className="mb-3 text-sm font-medium">
          {editProducto ? "Editar producto" : "Nuevo producto"}
        </p>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input
            name="codigo"
            type="text"
            required
            defaultValue={editProducto?.codigo ?? ""}
            placeholder="Código / SKU"
            className="input input-bordered"
            aria-label="Código"
          />
          <input
            name="nombre"
            required
            maxLength={120}
            defaultValue={editProducto?.nombre ?? ""}
            placeholder="Nombre del producto"
            className="input input-bordered sm:col-span-2"
            aria-label="Nombre"
          />
          <select
            name="proveedor_id"
            className="select select-bordered"
            defaultValue={editProducto?.proveedor_id ?? ""}
            aria-label="Proveedor"
          >
            <option value="">Sin proveedor</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <input
            name="precio_compra"
            type="number"
            min="0"
            step="0.01"
            defaultValue={editProducto?.precio_compra ?? ""}
            placeholder="Precio compra"
            className="input input-bordered"
            aria-label="Precio compra"
          />
          <input
            name="precio_mayoreo"
            type="number"
            min="0"
            step="0.01"
            defaultValue={editProducto?.precio_mayoreo ?? ""}
            placeholder="Precio mayoreo"
            className="input input-bordered"
            aria-label="Precio mayoreo"
          />
          <input
            name="precio_publico"
            type="number"
            required
            min="0"
            step="0.01"
            defaultValue={
              editProducto?.precio_publico ?? editProducto?.precio ?? ""
            }
            placeholder="Precio público"
            className="input input-bordered"
            aria-label="Precio público"
          />
          <input
            name="stock"
            type="number"
            required
            min="0"
            step="1"
            defaultValue={editProducto?.stock ?? ""}
            placeholder="Stock"
            className="input input-bordered"
            aria-label="Stock"
          />
          <input
            name="clave_sat"
            type="text"
            maxLength={8}
            defaultValue={editProducto?.clave_sat ?? "01010101"}
            placeholder="Clave SAT"
            className="input input-bordered"
            aria-label="Clave SAT"
          />
        </div>

        <input
          name="unidad_sat"
          type="text"
          maxLength={4}
          defaultValue={editProducto?.unidad_sat ?? "H87"}
          placeholder="Unidad SAT"
          className="input input-bordered mt-2 w-full sm:w-48"
          aria-label="Unidad SAT"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary touch-manipulation">
            {editProducto ? "Guardar cambios" : "Agregar producto"}
          </button>
          {editProducto && (
            <Link href={listHref()} className="btn btn-ghost touch-manipulation">
              Cancelar
            </Link>
          )}
        </div>
      </form>

      {error && (
        <div className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          {error.message}
        </div>
      )}

      {!pagination.total && !query ? (
        <div className="rounded-box border border-dashed border-base-300 bg-base-100 px-4 py-12 text-center text-base-content/60">
          Sin productos. Agrega el primero, importa un CSV o usa el{" "}
          <Link href="/chat" className="link link-primary">chat</Link>.
        </div>
      ) : (
        <div className="overflow-hidden rounded-box border border-base-200 bg-base-100">
          <ProductosTable productos={productos} />
          <ProductosPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            query={query}
          />
        </div>
      )}
    </div>
  )
}
