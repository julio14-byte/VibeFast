import { createClient } from "@/lib/supabase/server"

// Tool de ejemplo: crea un producto en el catálogo del usuario autenticado.
export const crearItem = {
  name: "crear_producto",
  description: "Crea un nuevo producto en el inventario del comercio autenticado.",
  parameters: {
    type: "object",
    properties: {
      nombre: { type: "string", description: "Nombre del producto." },
      codigo: { type: "string", description: "Código o SKU del producto." },
      precio: { type: "number", description: "Precio de venta." },
      stock: { type: "integer", description: "Existencias actuales." },
    },
    required: ["nombre", "codigo", "precio", "stock"],
    additionalProperties: false,
  },
  async execute({ nombre, codigo, precio, stock }) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    const { data, error } = await supabase
      .from("productos")
      .insert({ user_id: user.id, nombre, codigo, precio, stock })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return { ok: true, producto: data }
  },
}
