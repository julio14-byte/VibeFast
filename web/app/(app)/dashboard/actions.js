"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

// CRUD de productos vía Server Actions. La RLS de Supabase ya
// garantiza que cada quien solo toca sus filas; aun así filtramos
// por user_id como defensa en profundidad.

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

function parseProductoForm(formData) {
  const nombre = formData.get("nombre")?.toString().trim()
  const codigoRaw = formData.get("codigo")?.toString().trim()
  const precioRaw = formData.get("precio")?.toString().trim()
  const stockRaw = formData.get("stock")?.toString().trim()

  const codigo = codigoRaw ? Number.parseInt(codigoRaw, 10) : NaN
  const precio = precioRaw ? Number.parseFloat(precioRaw) : NaN
  const stock = stockRaw ? Number.parseInt(stockRaw, 10) : NaN

  if (!nombre || Number.isNaN(codigo) || Number.isNaN(precio) || Number.isNaN(stock)) {
    return null
  }
  if (codigo < 0 || precio < 0 || stock < 0) return null

  return { nombre, codigo, precio, stock }
}

function fail(message) {
  redirect(`/dashboard?error=${encodeURIComponent(message)}`)
}

export async function createProducto(formData) {
  try {
    const data = parseProductoForm(formData)
    if (!data) {
      fail("Revisa código, nombre, precio y stock. Todos son obligatorios.")
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
        fail(
          "La tabla productos no existe. Corre en la terminal: supabase db push"
        )
      }
      fail(error.message || "No se pudo crear el producto.")
    }

    revalidatePath("/dashboard")
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
    redirect("/dashboard?ok=eliminado")
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message || "Error inesperado al eliminar el producto.")
  }
}
