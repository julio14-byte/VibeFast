import { createClient } from "@/lib/supabase/server"

// Da de alta un producto nuevo en el inventario de la ferretería.
export const crearItem = {
  name: "crear_producto",
  description:
    "Registra un nuevo producto en el inventario de la ferretería con nombre, código, precio y stock inicial.",
  parameters: {
    type: "object",
    properties: {
      nombre: {
        type: "string",
        description: "Nombre o título del producto.",
      },
      codigo: {
        type: "number",
        description: "Código numérico único del producto.",
      },
      precio: {
        type: "number",
        description: "Precio de venta unitario.",
      },
      stock: {
        type: "number",
        description: "Cantidad inicial disponible en inventario.",
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

    const codigoStr = String(codigo).trim()
    if (!codigoStr) throw new Error("El código del producto es obligatorio.")

    const codigoNum = Number(codigo)
    if (!Number.isInteger(codigoNum) || codigoNum <= 0) {
      throw new Error("El código debe ser un número entero (ej. 1001).")
    }

    const precioNum = Number(precio)
    if (!Number.isFinite(precioNum) || precioNum < 0) {
      throw new Error("El precio debe ser un número mayor o igual a cero.")
    }

    const stockNum = Number(stock)
    if (!Number.isFinite(stockNum) || stockNum < 0) {
      throw new Error("El stock inicial debe ser un número mayor o igual a cero.")
    }

    const { data: existente } = await supabase
      .from("productos")
      .select("codigo")
      .eq("user_id", user.id)
      .eq("codigo", codigoNum)
      .maybeSingle()

    if (existente) {
      return {
        ok: false,
        error: `Ya existe un producto con el código ${codigoNum}.`,
      }
    }

    const { data, error } = await supabase
      .from("productos")
      .insert({
        user_id: user.id,
        nombre: nombreStr,
        codigo: codigoNum,
        precio: precioNum,
        stock: stockNum,
      })
      .select("id, codigo, nombre, precio, stock")
      .single()

    if (error) throw new Error(error.message)

    return {
      ok: true,
      mensaje: `Producto "${data.nombre}" (código ${data.codigo}) registrado correctamente.`,
      producto: {
        codigo: data.codigo,
        nombre: data.nombre,
        precio: data.precio,
        stock: data.stock,
      },
    }
  },
}
