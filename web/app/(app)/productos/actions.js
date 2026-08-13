"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

const BASE = "/productos"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${BASE}&error=auth`)
  return { supabase, user }
}

function parseOptionalNumber(raw, fallback = 0) {
  if (!raw?.toString().trim()) return fallback
  const n = Number.parseFloat(raw.toString().trim())
  return Number.isFinite(n) ? n : fallback
}

function parseProductoForm(formData) {
  const nombre = formData.get("nombre")?.toString().trim()
  const codigoRaw = formData.get("codigo")?.toString().trim()
  const precioCompraRaw = formData.get("precio_compra")?.toString().trim()
  const precioMayoreoRaw = formData.get("precio_mayoreo")?.toString().trim()
  const precioPublicoRaw = formData.get("precio_publico")?.toString().trim()
  const stockRaw = formData.get("stock")?.toString().trim()
  const proveedorId = formData.get("proveedor_id")?.toString().trim() || null
  const claveSat = formData.get("clave_sat")?.toString().trim() || "01010101"
  const unidadSat = formData.get("unidad_sat")?.toString().trim() || "H87"

  const codigo = codigoRaw ? Number.parseInt(codigoRaw, 10) : NaN
  const precio_compra = parseOptionalNumber(precioCompraRaw)
  const precio_mayoreo = parseOptionalNumber(precioMayoreoRaw)
  const precio_publico = precioPublicoRaw
    ? Number.parseFloat(precioPublicoRaw)
    : NaN
  const stock = stockRaw ? Number.parseInt(stockRaw, 10) : NaN

  if (
    !nombre ||
    Number.isNaN(codigo) ||
    Number.isNaN(precio_publico) ||
    Number.isNaN(stock)
  ) {
    return null
  }
  if (
    codigo < 0 ||
    precio_compra < 0 ||
    precio_mayoreo < 0 ||
    precio_publico < 0 ||
    stock < 0
  ) {
    return null
  }

  return {
    nombre,
    codigo,
    precio: precio_publico,
    precio_compra,
    precio_mayoreo,
    precio_publico,
    stock,
    proveedor_id: proveedorId || null,
    clave_sat: claveSat,
    unidad_sat: unidadSat,
  }
}

function fail(message) {
  redirect(`${BASE}?error=${encodeURIComponent(message)}`)
}

export async function createProducto(formData) {
  try {
    const data = parseProductoForm(formData)
    if (!data) fail("Revisa código, nombre, precios y stock.")

    const { supabase, user } = await requireUser()
    const { error } = await supabase.from("productos").insert({
      user_id: user.id,
      ...data,
    })

    if (error) {
      if (error.code === "23505") fail(`Ya existe código "${data.codigo}".`)
      fail(error.message || "No se pudo crear el producto.")
    }

    revalidatePath(BASE)
    revalidatePath("/inventario")
    revalidatePath("/ventas")
    redirect(`${BASE}?ok=creado`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message || "Error al crear.")
  }
}

export async function updateProducto(formData) {
  try {
    const id = formData.get("id")?.toString()
    const data = parseProductoForm(formData)
    if (!id || !data) fail("Datos inválidos.")

    const { supabase, user } = await requireUser()
    const { error } = await supabase
      .from("productos")
      .update(data)
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      if (error.code === "23505") fail(`Ya existe código "${data.codigo}".`)
      fail(error.message || "No se pudo actualizar.")
    }

    revalidatePath(BASE)
    revalidatePath("/inventario")
    revalidatePath("/ventas")
    redirect(`${BASE}?ok=actualizado`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message || "Error al actualizar.")
  }
}

export async function deleteProducto(formData) {
  try {
    const id = formData.get("id")?.toString()
    if (!id) fail("Falta el id.")

    const { supabase, user } = await requireUser()
    const { error } = await supabase
      .from("productos")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) fail(error.message || "No se pudo eliminar.")

    revalidatePath(BASE)
    revalidatePath("/inventario")
    redirect(`${BASE}?ok=eliminado`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message || "Error al eliminar.")
  }
}
