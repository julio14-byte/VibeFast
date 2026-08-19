import { mapProductoRows } from "@/lib/productos/format"
import { searchProductos } from "@/lib/productos/search"
import { requireToolOrgContext } from "@/lib/tools/orgContext"

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
    const { supabase, organizationId } = await requireToolOrgContext()

    const q = String(query ?? "").trim()
    if (!q) return { ok: true, total: 0, productos: [] }

    const { productos, total, error } = await searchProductos(
      supabase,
      organizationId,
      {
        query: q,
        limit: 50,
        offset: 0,
      }
    )

    if (error) throw new Error(error.message)

    const mapped = mapProductoRows(productos)

    return {
      ok: true,
      total,
      productos: mapped,
      mensaje: mapped.length
        ? `Encontré ${mapped.length} producto(s) para «${q}».`
        : `No hay productos que coincidan con «${q}».`,
    }
  },
}
