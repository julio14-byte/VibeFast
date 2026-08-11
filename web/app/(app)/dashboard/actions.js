"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

// CRUD de productos vía Server Actions. La RLS de Supabase ya
// garantiza que cada quien solo toca sus filas; aun así filtramos
// por user_id como defensa en profundidad.

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")
  return { supabase, user }
}

function parseProductoForm(formData) {
  const nombre = formData.get("nombre")?.toString().trim()
  const codigo = formData.get("codigo")?.toString().trim()
  const precioRaw = formData.get("precio")?.toString().trim()
  const stockRaw = formData.get("stock")?.toString().trim()

  const precio = precioRaw ? Number.parseFloat(precioRaw) : NaN
  const stock = stockRaw ? Number.parseInt(stockRaw, 10) : NaN

  if (!nombre || !codigo || Number.isNaN(precio) || Number.isNaN(stock)) {
    return null
  }
  if (precio < 0 || stock < 0) return null

  return { nombre, codigo, precio, stock }
}

export async function createProducto(formData) {
  const data = parseProductoForm(formData)
  if (!data) return

  const { supabase, user } = await requireUser()
  await supabase.from("productos").insert({
    user_id: user.id,
    ...data,
  })
  revalidatePath("/dashboard")
}

export async function updateProducto(formData) {
  const id = formData.get("id")?.toString()
  const data = parseProductoForm(formData)
  if (!id || !data) return

  const { supabase, user } = await requireUser()
  await supabase
    .from("productos")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id)
  revalidatePath("/dashboard")
}

export async function deleteProducto(formData) {
  const id = formData.get("id")?.toString()
  if (!id) return

  const { supabase, user } = await requireUser()
  await supabase
    .from("productos")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
  revalidatePath("/dashboard")
}
