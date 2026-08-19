import { normalizeCodigo } from "@/lib/productos/codigo"
import { requireToolOrgContext } from "@/lib/tools/orgContext"

export const crearItem = {
  name: "crear_producto",
  description:
    "Registra un nuevo producto en el inventario de la ferretería con nombre, código, precios (compra, mayoreo, público), stock y proveedor opcional.",
  parameters: {
    type: "object",
    properties: {
      nombre: {
        type: "string",
        description: "Nombre o título del producto.",
      },
      codigo: {
        type: "string",
        description: "Código alfanumérico único del producto.",
      },
      precio_compra: {
        type: "number",
        description: "Precio de compra al proveedor.",
      },
      precio_mayoreo: {
        type: "number",
        description: "Precio de venta mayoreo.",
      },
      precio_publico: {
        type: "number",
        description: "Precio de venta al público.",
      },
      precio: {
        type: "number",
        description: "Precio público (alias de precio_publico).",
      },
      stock: {
        type: "number",
        description: "Cantidad inicial disponible en inventario.",
      },
      proveedor_nombre: {
        type: "string",
        description: "Nombre del proveedor (opcional).",
      },
      clave_sat: {
        type: "string",
        description: "Clave producto/servicio SAT (default 01010101).",
      },
    },
    required: ["nombre", "codigo", "stock"],
    additionalProperties: false,
  },
  async execute({
    nombre,
    codigo,
    precio_compra = 0,
    precio_mayoreo = 0,
    precio_publico,
    precio,
    stock,
    proveedor_nombre,
    clave_sat = "01010101",
  }) {
    const { supabase, user, organizationId } = await requireToolOrgContext()

    const nombreStr = nombre?.trim()
    if (!nombreStr) throw new Error("El nombre del producto es obligatorio.")

    const codigoNorm = normalizeCodigo(String(codigo ?? ""))
    if (!codigoNorm) {
      throw new Error("El código debe ser alfanumérico (ej. BDLI018).")
    }

    const precioPublicoNum = Number(precio_publico ?? precio ?? 0)
    if (!Number.isFinite(precioPublicoNum) || precioPublicoNum < 0) {
      throw new Error("El precio público debe ser >= 0.")
    }

    const stockNum = Number(stock)
    if (!Number.isFinite(stockNum) || stockNum < 0) {
      throw new Error("El stock inicial debe ser >= 0.")
    }

    const { data: existente } = await supabase
      .from("productos")
      .select("codigo")
      .eq("organization_id", organizationId)
      .eq("codigo", codigoNorm)
      .maybeSingle()

    if (existente) {
      return {
        ok: false,
        error: `Ya existe un producto con el código ${codigoNorm}.`,
      }
    }

    let proveedor_id = null
    if (proveedor_nombre?.trim()) {
      const { data: prov } = await supabase
        .from("proveedores")
        .select("id")
        .eq("organization_id", organizationId)
        .ilike("nombre", proveedor_nombre.trim())
        .maybeSingle()

      if (prov) {
        proveedor_id = prov.id
      } else {
        const { data: newProv } = await supabase
          .from("proveedores")
          .insert({
            user_id: user.id,
            organization_id: organizationId,
            nombre: proveedor_nombre.trim(),
          })
          .select("id")
          .single()
        proveedor_id = newProv?.id
      }
    }

    const { data, error } = await supabase
      .from("productos")
      .insert({
        user_id: user.id,
        organization_id: organizationId,
        nombre: nombreStr,
        codigo: codigoNorm,
        precio: precioPublicoNum,
        precio_compra: Number(precio_compra) || 0,
        precio_mayoreo: Number(precio_mayoreo) || 0,
        precio_publico: precioPublicoNum,
        stock: stockNum,
        proveedor_id,
        clave_sat: clave_sat || "01010101",
        unidad_sat: "H87",
      })
      .select("id, codigo, nombre, precio_compra, precio_mayoreo, precio_publico, stock")
      .single()

    if (error) throw new Error(error.message)

    return {
      ok: true,
      mensaje: `Producto "${data.nombre}" (código ${data.codigo}) registrado correctamente.`,
      producto: data,
    }
  },
}
