import { createClient } from "@/lib/supabase/server"

export const gestionarInventario = {
  name: "gestionar_inventario",
  description:
    "Da de alta o actualiza un producto en el inventario de la ferretería (tabla productos). Si el código ya existe, actualiza nombre, precio y stock; si no, crea el producto.",
  parameters: {
    type: "object",
    properties: {
      nombre: {
        type: "string",
        description: "Nombre o título del producto.",
      },
      codigo: {
        type: "string",
        description: "Código único, SKU o código de barras.",
      },
      precio: {
        type: "number",
        description: "Precio de venta unitario.",
      },
      stock: {
        type: "number",
        description: "Cantidad disponible en existencia.",
      },
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

    const nombreStr = nombre?.trim()
    if (!nombreStr) throw new Error("El nombre del producto es obligatorio.")

    const codigoStr = String(codigo ?? "").trim()
    if (!codigoStr) throw new Error("El código del producto es obligatorio.")

    const precioNum = Number(precio)
    if (!Number.isFinite(precioNum) || precioNum < 0) {
      throw new Error("El precio debe ser un número >= 0.")
    }

    const stockNum = Number(stock)
    if (!Number.isFinite(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
      throw new Error("El stock debe ser un entero >= 0.")
    }

    const { data: existente, error: selectError } = await supabase
      .from("productos")
      .select("id, codigo, nombre, precio, stock")
      .eq("user_id", user.id)
      .eq("codigo", codigoStr)
      .maybeSingle()

    if (selectError) throw new Error(selectError.message)

    if (existente) {
      const { data, error } = await supabase
        .from("productos")
        .update({
          nombre: nombreStr,
          precio: precioNum,
          precio_publico: precioNum,
          stock: stockNum,
        })
        .eq("id", existente.id)
        .eq("user_id", user.id)
        .select("id, codigo, nombre, precio, precio_publico, stock")
        .single()

      if (error) throw new Error(error.message)

      return {
        ok: true,
        accion: "actualizado",
        mensaje: `Producto "${data.nombre}" (código ${data.codigo}) actualizado en inventario.`,
        producto: data,
      }
    }

    const { data, error } = await supabase
      .from("productos")
      .insert({
        user_id: user.id,
        nombre: nombreStr,
        codigo: codigoStr,
        precio: precioNum,
        precio_publico: precioNum,
        precio_compra: 0,
        precio_mayoreo: 0,
        stock: stockNum,
        clave_sat: "01010101",
        unidad_sat: "H87",
      })
      .select("id, codigo, nombre, precio, precio_publico, stock")
      .single()

    if (error) throw new Error(error.message)

    return {
      ok: true,
      accion: "creado",
      mensaje: `Producto "${data.nombre}" (código ${data.codigo}) registrado en inventario.`,
      producto: data,
    }
  },
}
