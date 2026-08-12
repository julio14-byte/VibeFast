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
        description: "Texto a buscar en nombre o código numérico del producto.",
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
    const codigo = Number.parseInt(q, 10)
    const porCodigo = !Number.isNaN(codigo) && String(codigo) === q

    let request = supabase
      .from("productos")
      .select("id, nombre, codigo, precio, stock")
      .eq("user_id", user.id)

    if (porCodigo) {
      request = request.or(`nombre.ilike.%${q}%,codigo.eq.${codigo}`)
    } else {
      request = request.ilike("nombre", `%${q}%`)
    }

    const { data, error } = await request
    if (error) throw new Error(error.message)
    return { ok: true, productos: data }
  },
}
