import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "Inventario · SmartPOS" }
export const dynamic = "force-dynamic"

function formatPrecio(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value)
}

export default async function InventarioPage() {
  const supabase = await createClient()
  const { data: productos, error } = await supabase
    .from("productos")
    .select("*")
    .order("nombre", { ascending: true })

  const alertas = productos?.filter((p) => p.stock < 2) ?? []

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
        <p className="mt-1 text-sm text-base-content/70">
          Stock actual de tus productos. Los que tienen menos de 2 unidades se
          marcan en alerta.
        </p>
      </div>

      {error && (
        <div role="alert" className="alert alert-error">
          <span>No pudimos cargar el inventario: {error.message}</span>
        </div>
      )}

      {!productos?.length ? (
        <div className="rounded-box border border-dashed border-base-300 bg-base-100 px-4 py-10 text-center">
          <p className="text-base-content/70">Aún no hay productos guardados.</p>
          <Link href="/dashboard" className="btn btn-primary btn-sm mt-4">
            Ir a Productos y agregar el primero
          </Link>
        </div>
      ) : (
        <>
          {alertas.length > 0 && (
            <div role="alert" className="alert alert-warning">
              <AlertTriangle className="size-5" />
              <span>
                {alertas.length} producto{alertas.length === 1 ? "" : "s"} con
                stock bajo (menos de 2 unidades).
              </span>
            </div>
          )}

          <div className="overflow-x-auto rounded-box border border-base-200 bg-base-100">
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th className="text-right">Stock</th>
                  <th className="text-right">Precio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono tabular-nums text-sm">{p.codigo}</td>
                    <td className="font-medium">{p.nombre}</td>
                    <td className="text-right">
                      <span
                        className={`badge badge-sm ${
                          p.stock === 0
                            ? "badge-error"
                            : p.stock < 2
                              ? "badge-warning"
                              : "badge-success"
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="text-right">{formatPrecio(p.precio)}</td>
                    <td>
                      {p.stock === 0 ? (
                        <span className="text-sm text-error">Agotado</span>
                      ) : p.stock < 2 ? (
                        <span className="text-sm text-warning">Bajo</span>
                      ) : (
                        <span className="text-sm text-success">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
