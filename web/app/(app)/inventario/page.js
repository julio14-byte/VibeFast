import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import InventarioClient from "@/components/inventario/InventarioClient"

export const metadata = { title: "Inventario · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function InventarioPage() {
  const supabase = await createClient()
  const { data: productos, error } = await supabase
    .from("productos")
    .select("*, proveedor:proveedores(id, nombre)")
    .order("nombre", { ascending: true })

  const alertas = productos?.filter((p) => p.stock < 2) ?? []

  if (error) {
    return (
      <div role="alert" className="alert alert-error">
        <span>No pudimos cargar el inventario: {error.message}</span>
      </div>
    )
  }

  if (!productos?.length) {
    return (
      <div className="mx-auto max-w-3xl rounded-box border border-dashed border-base-300 bg-base-100 px-4 py-10 text-center">
        <p className="text-base-content/70">Aún no hay productos guardados.</p>
        <Link href="/productos" className="btn btn-primary btn-sm mt-4">
          Ir a Productos
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <InventarioClient productos={productos} alertasCount={alertas.length} />
    </div>
  )
}
