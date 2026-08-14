import { createClient } from "@/lib/supabase/server"
import { applyProductSearchFilter } from "@/lib/productos/search"
import { mapProductoRows } from "@/lib/productos/format"

export const buscarItems = {
  name: "buscar_productos",
  description:
    "Busca productos en el inventario por descripción o código.",
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
        "codigo, nombre, stock, precio_compra, precio_mayoreo, precio_publico, precio, margen_ganancia"
      )

    request = applyProductSearchFilter(request, q, user.id)

    const { data, error } = await request.order("nombre", { ascending: true })
    if (error) throw new Error(error.message)

    const productos = mapProductoRows(data)

    return { ok: true, total: productos.length, productos }
  },
}
