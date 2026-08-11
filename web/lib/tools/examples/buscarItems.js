import { createClient } from "@/lib/supabase/server"

// Tool de ejemplo: busca productos del usuario por nombre o código.
export const buscarItems = {
  name: "buscar_productos",
  description: "Busca productos del comercio por coincidencia en nombre o código.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Texto a buscar en nombre o código del producto.",
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

    const { data, error } = await supabase
      .from("productos")
      .select("id, nombre, codigo, precio, stock")
      .eq("user_id", user.id)
      .or(`nombre.ilike.%${query}%,codigo.ilike.%${query}%`)
    if (error) throw new Error(error.message)
    return { ok: true, productos: data }
  },
}
