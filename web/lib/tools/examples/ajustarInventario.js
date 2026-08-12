import { createClient } from "@/lib/supabase/server"

// Actualiza nombre, precio y stock de un producto existente por código.
export const ajustarInventario = {
  name: "ajustar_inventario",
  description:
    "Actualiza un producto existente en el inventario: nombre, precio y stock.",
  parameters: {
    type: "object",
    properties: {
      codigo: {
        type: "number",
        description: "Código numérico del producto a actualizar.",
      },
      nombre: {
        type: "string",
        description: "Nombre o título del producto.",
      },
      precio: {
        type: "number",
        description: "Precio de venta unitario.",
      },
      stock: {
        type: "number",
        description: "Cantidad disponible en inventario.",
      },
    },
    required: ["codigo", "nombre", "precio", "stock"],
    additionalProperties: false,
  },
  async execute({ codigo, nombre, precio, stock }) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    const codigoNum = Number(codigo)
    if (!Number.isInteger(codigoNum) || codigoNum <= 0) {
      throw new Error("El código debe ser un número entero (ej. 1001).")
    }

    const nombreStr = nombre?.trim()
    if (!nombreStr) throw new Error("El nombre del producto es obligatorio.")

    const precioNum = Number(precio)
    if (!Number.isFinite(precioNum) || precioNum < 0) {
      throw new Error("El precio debe ser un número mayor o igual a cero.")
    }

    const stockNum = Number(stock)
    if (!Number.isFinite(stockNum) || stockNum < 0) {
      throw new Error("El stock debe ser un número mayor o igual a cero.")
    }

    const { data: producto, error: selectError } = await supabase
      .from("productos")
      .select("id, codigo, nombre, precio, stock")
      .eq("user_id", user.id)
      .eq("codigo", codigoNum)
      .maybeSingle()

    if (selectError) throw new Error(selectError.message)
    if (!producto) {
      return { ok: false, error: `No se encontró un producto con código ${codigoNum}.` }
    }

    const { data: actualizado, error: updateError } = await supabase
      .from("productos")
      .update({
        nombre: nombreStr,
        precio: precioNum,
        stock: stockNum,
      })
      .eq("id", producto.id)
      .eq("user_id", user.id)
      .select("codigo, nombre, precio, stock")
      .single()

    if (updateError) throw new Error(updateError.message)

    return {
      ok: true,
      mensaje: `Producto "${actualizado.nombre}" (código ${actualizado.codigo}) actualizado correctamente.`,
      producto: {
        codigo: actualizado.codigo,
        descripcion: actualizado.nombre,
        nombre: actualizado.nombre,
        precio: actualizado.precio,
        stock: actualizado.stock,
        anterior: {
          descripcion: producto.nombre,
          precio: producto.precio,
          stock: producto.stock,
        },
      },
    }
  },
}
