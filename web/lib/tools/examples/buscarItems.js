import { createClient } from "@/lib/supabase/server"

function termVariants(term) {
  const t = term.toLowerCase()
  const variants = new Set([t])
  if (t.length > 3 && t.endsWith("s")) variants.add(t.slice(0, -1))
  if (t.length > 4 && t.endsWith("es")) variants.add(t.slice(0, -2))
  return [...variants]
}

// Busca productos del inventario de la ferretería por descripción o código.
export const buscarItems = {
  name: "buscar_productos",
  description:
    "Busca productos en el inventario de la ferretería por descripción o código.",
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

    const codigo = Number.parseInt(q, 10)
    const porCodigo = !Number.isNaN(codigo) && String(codigo) === q

    let request = supabase
      .from("productos")
      .select("codigo, nombre, stock")
      .eq("user_id", user.id)

    if (porCodigo) {
      request = request.or(`nombre.ilike.%${q}%,codigo.eq.${codigo}`)
    } else {
      const terms = q.split(/\s+/).filter(Boolean)

      for (const term of terms) {
        const asCodigo = Number.parseInt(term, 10)
        if (!Number.isNaN(asCodigo) && String(asCodigo) === term) {
          request = request.or(
            `nombre.ilike.%${term}%,codigo.eq.${asCodigo}`
          )
        } else {
          const variants = termVariants(term)
          const orClause = variants
            .map((v) => `nombre.ilike.%${v}%`)
            .join(",")
          request = request.or(orClause)
        }
      }
    }

    const { data, error } = await request.order("nombre", { ascending: true })
    if (error) throw new Error(error.message)

    const productos = (data ?? []).map((p) => ({
      codigo: p.codigo,
      descripcion: p.nombre,
      stock: p.stock,
    }))

    return { ok: true, total: productos.length, productos }
  },
}
