import { createClient } from "@/lib/supabase/server"
import { applyProductSearchFilter } from "@/lib/productos/search"

export const buscarItems = {
  name: "buscar_productos",
  description:
    "Busca productos en el inventario de la ferretería por descripción, código o proveedor.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "Texto que el cliente o vendedor está buscando (nombre, descripción o código).",
      },
    },
    required: ["query"],
    additionalProperties: false,
  },
  async execute({ query }) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    const q = query.trim()
    if (!q) return { ok: true, total: 0, productos: [] }

    let request = supabase
      .from("productos")
      .select(
        "codigo, nombre, stock, precio_compra, precio_mayoreo, precio_publico, precio, proveedor:proveedores(nombre)"
      )

    request = applyProductSearchFilter(request, q, user.id)

    const { data, error } = await request.order("nombre", { ascending: true })
    if (error) throw new Error(error.message)

    const productos = (data ?? []).map((p) => ({
      codigo: p.codigo,
      descripcion: p.nombre,
      stock: p.stock,
      precio_compra: p.precio_compra,
      precio_mayoreo: p.precio_mayoreo,
      precio_publico: p.precio_publico ?? p.precio,
      proveedor: p.proveedor?.nombre ?? null,
    }))

    return { ok: true, total: productos.length, productos }
  },
}
