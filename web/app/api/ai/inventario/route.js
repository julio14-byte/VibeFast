// ============================================================
// POST /api/ai/inventario
// ------------------------------------------------------------
// Body:
//   { desdeCatalogo: true }  → lee productos del usuario en Supabase
//   { texto: string }        → analiza una nota libre
// Resp:
//   { resumen, productos: [{ producto, codigo?, stock, alertaAgotamiento, mensaje }] }
// ============================================================

import { NextResponse } from "next/server"
import { z } from "zod"
import { generateObject } from "@/lib/openai/structured"
import { createClient, getUser } from "@/lib/supabase/server"

const itemSchema = z.object({
  producto: z.string().describe("Nombre del producto"),
  codigo: z.number().describe("Código numérico del producto"),
  stock: z.number().describe("Unidades disponibles"),
  alertaAgotamiento: z
    .boolean()
    .describe("true si el stock está bajo o a punto de agotarse (≤ 5)"),
  mensaje: z
    .string()
    .describe("Nota corta en español sobre este producto"),
})

const inventarioSchema = z.object({
  resumen: z
    .string()
    .describe("Resumen general del inventario en 1–2 oraciones"),
  productos: z
    .array(itemSchema)
    .describe("Lista de productos analizados"),
})

export async function POST(request) {
  try {
    const body = await request.json()
    const { texto, desdeCatalogo } = body ?? {}

    let prompt

    if (desdeCatalogo) {
      const user = await getUser()
      if (!user) {
        return NextResponse.json({ error: "No autenticado." }, { status: 401 })
      }

      const supabase = await createClient()
      const { data: productos, error } = await supabase
        .from("productos")
        .select("nombre, codigo, stock, precio")
        .eq("user_id", user.id)
        .order("nombre", { ascending: true })

      if (error) {
        if (error.message?.includes("does not exist") || error.code === "42P01") {
          return NextResponse.json(
            {
              error:
                "La tabla productos no existe. Corre en la terminal: supabase db push",
            },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: error.message || "No se pudo leer el catálogo." },
          { status: 500 }
        )
      }

      if (!productos?.length) {
        return NextResponse.json(
          {
            error:
              "Aún no tienes productos. Agrégalos en /dashboard y vuelve a checar.",
          },
          { status: 400 }
        )
      }

      const catalogo = productos
        .map(
          (p) =>
            `- ${p.nombre} (código ${p.codigo}): stock=${p.stock}, precio=${p.precio}`
        )
        .join("\n")

      prompt = `Eres el asistente de inventario de SmartPOS.
Analiza el catálogo real del comercio y marca alertaAgotamiento=true cuando stock ≤ 5 (o 0).
Devuelve todos los productos y un resumen general.

Catálogo:
${catalogo}`
    } else {
      if (!texto || typeof texto !== "string" || !texto.trim()) {
        return NextResponse.json(
          { error: "texto requerido, o envía desdeCatalogo: true." },
          { status: 400 }
        )
      }

      prompt = `Eres un asistente de inventario para un comercio (SmartPOS).
Analiza el siguiente texto sobre existencias.
Extrae cada producto con stock, si hay alerta de agotamiento (stock bajo / ≤ 5) y un mensaje breve.
Incluye un resumen general.

Texto del usuario:
"""
${texto.trim()}
"""`
    }

    const parsed = await generateObject(inventarioSchema, prompt)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error("[ai/inventario]", err?.message)
    return NextResponse.json(
      { error: "Error procesando la solicitud." },
      { status: 500 }
    )
  }
}
