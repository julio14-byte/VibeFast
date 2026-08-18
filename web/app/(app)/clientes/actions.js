"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

const BASE = "/clientes"

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

function parseClienteForm(formData) {
  const razon_social = formData.get("razon_social")?.toString().trim()
  const nombre = formData.get("nombre")?.toString().trim() || razon_social
  const rfc = formData.get("rfc")?.toString().trim().toUpperCase() || "XAXX010101000"
  const email = formData.get("email")?.toString().trim() || null
  const telefono = formData.get("telefono")?.toString().trim() || null
  const direccion = formData.get("direccion")?.toString().trim() || null
  const codigo_postal = formData.get("codigo_postal")?.toString().trim() || null
  const regimen_fiscal = formData.get("regimen_fiscal")?.toString() || "616"
  const uso_cfdi = formData.get("uso_cfdi")?.toString() || "G03"
  const usa_precio_mayoreo =
    formData.get("usa_precio_mayoreo")?.toString() === "1"

  if (!razon_social) return null

  return {
    nombre,
    razon_social,
    rfc,
    email,
    telefono,
    direccion,
    codigo_postal,
    regimen_fiscal,
    uso_cfdi,
    usa_precio_mayoreo,
  }
}

export async function createCliente(formData) {
  try {
    const data = parseClienteForm(formData)
    if (!data) fail("La razón social es obligatoria.")

    const { supabase, user } = await requireUser()
    const { error } = await supabase.from("clientes").insert({
      user_id: user.id,
      ...data,
    })

    if (error) fail(error.message)

    revalidatePath(BASE)
    revalidatePath("/facturacion")
    revalidatePath("/ventas")
    redirect(`${BASE}?ok=creado`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message)
  }
}

export async function updateCliente(formData) {
  try {
    const id = formData.get("id")?.toString()
    const data = parseClienteForm(formData)
    if (!id || !data) fail("Datos inválidos.")

    const { supabase, user } = await requireUser()
    const { error } = await supabase
      .from("clientes")
      .update(data)
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) fail(error.message)

    revalidatePath(BASE)
    revalidatePath("/facturacion")
    revalidatePath("/ventas")
    redirect(`${BASE}?ok=actualizado`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message)
  }
}

export async function deleteCliente(formData) {
  try {
    const id = formData.get("id")?.toString()
    if (!id) fail("Falta el id.")

    const { supabase, user } = await requireUser()

    const { data: cliente } = await supabase
      .from("clientes")
      .select("es_publico_general")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (cliente?.es_publico_general) {
      fail("No se puede eliminar el cliente Público en general.")
    }

    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) fail(error.message)

    revalidatePath(BASE)
    revalidatePath("/facturacion")
    redirect(`${BASE}?ok=eliminado`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message)
  }
}
