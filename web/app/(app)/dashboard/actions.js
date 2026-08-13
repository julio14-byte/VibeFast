"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=/dashboard&error=auth")
  }

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

function fail(message, path = "/dashboard") {
  redirect(`${path}?error=${encodeURIComponent(message)}`)
}

export async function createProducto(formData) {
  try {
    const data = parseProductoForm(formData)
    if (!data) {
      fail("Revisa código, nombre, precios y stock. Todos son obligatorios.")
    }

    const { supabase, user } = await requireUser()
    const { error } = await supabase.from("productos").insert({
      user_id: user.id,
      ...data,
    })

    if (error) {
      if (error.code === "23505") {
        fail(`Ya existe un producto con el código "${data.codigo}".`)
      }
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        fail("La tabla productos no existe. Corre: supabase db push")
      }
      fail(error.message || "No se pudo crear el producto.")
    }

    revalidatePath("/dashboard")
    revalidatePath("/inventario")
    revalidatePath("/ventas")
    redirect("/dashboard?ok=creado")
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message || "Error inesperado al crear el producto.")
  }
}

export async function updateProducto(formData) {
  try {
    const id = formData.get("id")?.toString()
    const data = parseProductoForm(formData)
    if (!id || !data) {
      fail("Datos inválidos al actualizar el producto.")
    }

    const { supabase, user } = await requireUser()
    const { error } = await supabase
      .from("productos")
      .update(data)
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      if (error.code === "23505") {
        fail(`Ya existe un producto con el código "${data.codigo}".`)
      }
      fail(error.message || "No se pudo actualizar el producto.")
    }

    revalidatePath("/dashboard")
    revalidatePath("/inventario")
    revalidatePath("/ventas")
    redirect("/dashboard?ok=actualizado")
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message || "Error inesperado al actualizar el producto.")
  }
}

export async function deleteProducto(formData) {
  try {
    const id = formData.get("id")?.toString()
    if (!id) fail("Falta el id del producto.")

    const { supabase, user } = await requireUser()
    const { error } = await supabase
      .from("productos")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      fail(error.message || "No se pudo eliminar el producto.")
    }

    revalidatePath("/dashboard")
    revalidatePath("/inventario")
    redirect("/dashboard?ok=eliminado")
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message || "Error inesperado al eliminar el producto.")
  }
}

export async function createProveedor(formData) {
  try {
    const nombre = formData.get("nombre")?.toString().trim()
    if (!nombre) fail("El nombre del proveedor es obligatorio.", "/proveedores")

    const { supabase, user } = await requireUser()
    const { error } = await supabase.from("proveedores").insert({
      user_id: user.id,
      nombre,
      contacto: formData.get("contacto")?.toString().trim() || null,
      telefono: formData.get("telefono")?.toString().trim() || null,
      email: formData.get("email")?.toString().trim() || null,
      notas: formData.get("notas")?.toString().trim() || null,
    })

    if (error) fail(error.message, "/proveedores")

    revalidatePath("/proveedores")
    revalidatePath("/dashboard")
    redirect("/proveedores?ok=creado")
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message, "/proveedores")
  }
}

export async function deleteProveedor(formData) {
  try {
    const id = formData.get("id")?.toString()
    if (!id) fail("Falta el id.", "/proveedores")

    const { supabase, user } = await requireUser()
    const { error } = await supabase
      .from("proveedores")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) fail(error.message, "/proveedores")

    revalidatePath("/proveedores")
    revalidatePath("/dashboard")
    redirect("/proveedores?ok=eliminado")
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message, "/proveedores")
  }
}
