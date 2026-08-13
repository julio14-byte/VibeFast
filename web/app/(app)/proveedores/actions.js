"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

const BASE = "/proveedores"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${BASE}&error=auth`)
  return { supabase, user }
}

function fail(message) {
  redirect(`${BASE}?error=${encodeURIComponent(message)}`)
}

export async function createProveedor(formData) {
  try {
    const nombre = formData.get("nombre")?.toString().trim()
    if (!nombre) fail("El nombre del proveedor es obligatorio.")

    const { supabase, user } = await requireUser()
    const { error } = await supabase.from("proveedores").insert({
      user_id: user.id,
      nombre,
      contacto: formData.get("contacto")?.toString().trim() || null,
      telefono: formData.get("telefono")?.toString().trim() || null,
      email: formData.get("email")?.toString().trim() || null,
      notas: formData.get("notas")?.toString().trim() || null,
    })

    if (error) fail(error.message)

    revalidatePath(BASE)
    revalidatePath("/productos")
    redirect(`${BASE}?ok=creado`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message)
  }
}

export async function deleteProveedor(formData) {
  try {
    const id = formData.get("id")?.toString()
    if (!id) fail("Falta el id.")

    const { supabase, user } = await requireUser()
    const { error } = await supabase
      .from("proveedores")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) fail(error.message)

    revalidatePath(BASE)
    revalidatePath("/productos")
    redirect(`${BASE}?ok=eliminado`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message)
  }
}
