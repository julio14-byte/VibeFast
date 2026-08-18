import { createClient } from "@/lib/supabase/server"
import { mapProductoRow, mapProductoRows } from "@/lib/productos/format"
import { searchProductos } from "@/lib/productos/search"
import { requireOrganizationId } from "@/lib/organization/context"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")
  const organizationId = await requireOrganizationId(supabase, user.id)
  return { supabase, user, organizationId }
}

const buscarProductos = {
  name: "buscar_productos",
  title: "Buscar productos",
  description:
    "Busca productos en el inventario por nombre o código (parcial o exacto). Devuelve existencias y precios.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Texto a buscar: nombre del producto o código numérico.",
      },
      limit: {
        type: "integer",
        description: "Máximo de resultados (1–50). Por defecto 12.",
      },
    },
    required: ["query"],
    additionalProperties: false,
  },
  async execute({ query, limit = 12 }) {
    const { supabase, organizationId } = await requireUser()
    const q = String(query ?? "").trim()
    if (!q) {
      return { ok: true, total: 0, productos: [], mensaje: "Indica un texto o código para buscar." }
    }

    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 12))
    const { productos, total, error } = await searchProductos(supabase, organizationId, {
      query: q,
      limit: safeLimit,
      offset: 0,
    })

    if (error) throw new Error(error.message)

    const mapped = mapProductoRows(productos)
    return {
      ok: true,
      total,
      productos: mapped,
      mensaje:
        mapped.length
          ? `Encontré ${mapped.length} producto(s) para «${q}».`
          : `No hay productos que coincidan con «${q}».`,
    }
  },
}

const obtenerProductoPorCodigo = {
  name: "obtener_producto_por_codigo",
  title: "Producto por código",
  description:
    "Obtiene un producto exacto por su código numérico (SKU interno de la tienda).",
  parameters: {
    type: "object",
    properties: {
      codigo: {
        type: "integer",
        description: "Código numérico del producto.",
      },
    },
    required: ["codigo"],
    additionalProperties: false,
  },
  async execute({ codigo }) {
    const { supabase, organizationId } = await requireUser()
    const codigoNum = Number(codigo)
    if (!Number.isInteger(codigoNum) || codigoNum <= 0) {
      return { ok: false, error: "Código inválido. Usa un número entero positivo." }
    }

    const { data, error } = await supabase
      .from("productos")
      .select(
        "codigo, nombre, stock, precio, precio_compra, precio_mayoreo, precio_publico, margen_ganancia, clave_sat, unidad_sat"
      )
      .eq("organization_id", organizationId)
      .eq("codigo", codigoNum)
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) {
      return { ok: false, error: `No hay producto con código ${codigoNum}.` }
    }

    const producto = mapProductoRow(data)
    return {
      ok: true,
      producto,
      mensaje: `${producto.nombre} (código ${producto.codigo}): stock ${producto.stock}.`,
    }
  },
}

const listarProductos = {
  name: "listar_productos",
  title: "Listar productos",
  description:
    "Lista productos del catálogo con paginación. Opcionalmente filtra por nombre o código.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Filtro opcional por nombre o código.",
      },
      limit: {
        type: "integer",
        description: "Cantidad máxima (1–50). Por defecto 20.",
      },
      offset: {
        type: "integer",
        description: "Desplazamiento para paginar. Por defecto 0.",
      },
    },
    additionalProperties: false,
  },
  async execute({ query = "", limit = 20, offset = 0 } = {}) {
    const { supabase, organizationId } = await requireUser()
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20))
    const safeOffset = Math.max(0, Number(offset) || 0)

    const { productos, total, error } = await searchProductos(supabase, organizationId, {
      query: String(query ?? "").trim(),
      limit: safeLimit,
      offset: safeOffset,
    })

    if (error) throw new Error(error.message)

    const mapped = mapProductoRows(productos)
    return {
      ok: true,
      total,
      offset: safeOffset,
      limit: safeLimit,
      productos: mapped,
      mensaje: `Mostrando ${mapped.length} de ${total} producto(s).`,
    }
  },
}

const productosBajoStock = {
  name: "productos_bajo_stock",
  title: "Productos con poco stock",
  description:
    "Lista productos cuya existencia es menor o igual a un umbral (por defecto 5 unidades).",
  parameters: {
    type: "object",
    properties: {
      umbral: {
        type: "integer",
        description: "Stock máximo inclusive para considerar «bajo» (por defecto 5).",
      },
      limit: {
        type: "integer",
        description: "Máximo de resultados (1–50). Por defecto 25.",
      },
    },
    additionalProperties: false,
  },
  async execute({ umbral = 5, limit = 25 } = {}) {
    const { supabase, organizationId } = await requireUser()
    const safeUmbral = Math.max(0, Number(umbral) || 5)
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 25))

    const { data, error } = await supabase
      .from("productos")
      .select(
        "codigo, nombre, stock, precio, precio_compra, precio_mayoreo, precio_publico, margen_ganancia, clave_sat, unidad_sat"
      )
      .eq("organization_id", organizationId)
      .lte("stock", safeUmbral)
      .order("stock", { ascending: true })
      .order("nombre", { ascending: true })
      .limit(safeLimit)

    if (error) throw new Error(error.message)

    const mapped = mapProductoRows(data)
    return {
      ok: true,
      umbral: safeUmbral,
      total: mapped.length,
      productos: mapped,
      mensaje:
        mapped.length
          ? `${mapped.length} producto(s) con stock ≤ ${safeUmbral}.`
          : `No hay productos con stock ≤ ${safeUmbral}.`,
    }
  },
}

export const PRODUCTOS_MCP_TOOLS = [
  buscarProductos,
  obtenerProductoPorCodigo,
  listarProductos,
  productosBajoStock,
]

export function getProductosMcpTools() {
  return PRODUCTOS_MCP_TOOLS
}
