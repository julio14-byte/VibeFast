import { normalizeCodigo } from "@/lib/productos/codigo"
import { requireToolOrgContext } from "@/lib/tools/orgContext"

export const ajustarInventario = {
  name: "ajustar_inventario",
  description:
    "Actualiza un producto existente: nombre, precios (compra, mayoreo, público) y stock.",
  parameters: {
    type: "object",
    properties: {
      codigo: {
        type: "string",
        description: "Código alfanumérico del producto a actualizar.",
      },
      nombre: {
        type: "string",
        description: "Nombre o título del producto.",
      },
      precio_compra: {
        type: "number",
        description: "Precio de compra.",
      },
      precio_mayoreo: {
        type: "number",
        description: "Precio mayoreo.",
      },
      precio_publico: {
        type: "number",
        description: "Precio público.",
      },
      precio: {
        type: "number",
        description: "Precio público (alias).",
      },
      stock: {
        type: "number",
        description: "Cantidad disponible en inventario.",
      },
    },
    required: ["codigo"],
    additionalProperties: false,
  },
  async execute({
    codigo,
    nombre,
    precio_compra,
    precio_mayoreo,
    precio_publico,
    precio,
    stock,
  }) {
    const { supabase, organizationId } = await requireToolOrgContext()

    const codigoNorm = normalizeCodigo(String(codigo ?? ""))
    if (!codigoNorm) {
      throw new Error("El código es inválido.")
    }

    const { data: producto, error: selectError } = await supabase
      .from("productos")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("codigo", codigoNorm)
      .maybeSingle()

    if (selectError) throw new Error(selectError.message)
    if (!producto) {
      return { ok: false, error: `No se encontró producto con código ${codigoNorm}.` }
    }

    const updates = {}
    if (nombre?.trim()) updates.nombre = nombre.trim()
    if (precio_compra != null) updates.precio_compra = Number(precio_compra)
    if (precio_mayoreo != null) updates.precio_mayoreo = Number(precio_mayoreo)
    if (precio_publico != null || precio != null) {
      const p = Number(precio_publico ?? precio)
      updates.precio_publico = p
      updates.precio = p
    }
    if (stock != null) updates.stock = Number(stock)

    if (Object.keys(updates).length === 0) {
      return { ok: false, error: "No hay campos para actualizar." }
    }

    const { data: actualizado, error: updateError } = await supabase
      .from("productos")
      .update(updates)
      .eq("id", producto.id)
      .eq("organization_id", organizationId)
      .select("codigo, nombre, precio_compra, precio_mayoreo, precio_publico, stock")
      .single()

    if (updateError) throw new Error(updateError.message)

    return {
      ok: true,
      mensaje: `Producto "${actualizado.nombre}" (código ${actualizado.codigo}) actualizado.`,
      producto: actualizado,
      anterior: producto,
    }
  },
}
