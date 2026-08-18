"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireOrgContext } from "@/lib/organization/context"

const BASE = "/negocio"

const REVALIDATE_PATHS = [
  BASE,
  "/facturacion",
  "/ventas",
  "/settings",
  "/dashboard",
]

async function requireUser() {
  return requireOrgContext(BASE)
}

function fail(message) {
  redirect(`${BASE}?error=${encodeURIComponent(message)}`)
}

function checkbox(formData, name) {
  return formData.get(name)?.toString() === "1"
}

function parseNegocioForm(formData) {
  return {
    nombre_comercial: formData.get("nombre_comercial")?.toString().trim() || null,
    telefono: formData.get("telefono")?.toString().trim() || null,
    email: formData.get("email")?.toString().trim() || null,
    rfc: formData.get("rfc")?.toString().trim().toUpperCase() || "",
    razon_social: formData.get("razon_social")?.toString().trim() || "",
    regimen_fiscal: formData.get("regimen_fiscal")?.toString() || "612",
    codigo_postal: formData.get("codigo_postal")?.toString().trim() || "",
    direccion: formData.get("direccion")?.toString().trim() || null,
    serie_factura: formData.get("serie_factura")?.toString().trim() || "A",
    ticket_mensaje_pie:
      formData.get("ticket_mensaje_pie")?.toString().trim() ||
      "¡Gracias por su compra!",
    ticket_texto_extra:
      formData.get("ticket_texto_extra")?.toString().trim() || null,
    ticket_mostrar_rfc: checkbox(formData, "ticket_mostrar_rfc"),
    ticket_mostrar_direccion: checkbox(formData, "ticket_mostrar_direccion"),
    ticket_mostrar_telefono: checkbox(formData, "ticket_mostrar_telefono"),
    ticket_mostrar_cliente: checkbox(formData, "ticket_mostrar_cliente"),
    ticket_mostrar_iva: checkbox(formData, "ticket_mostrar_iva"),
    ticket_mostrar_forma_pago: checkbox(formData, "ticket_mostrar_forma_pago"),
  }
}

function revalidateNegocio() {
  for (const p of REVALIDATE_PATHS) revalidatePath(p)
}

export async function guardarNegocio(formData) {
  try {
    const { supabase, user, organizationId, organization, role } =
      await requireUser()
    const data = parseNegocioForm(formData)

    if (!data.rfc || !data.razon_social || !data.codigo_postal) {
      fail("RFC, razón social y código postal son obligatorios.")
    }

    const { data: existing } = await supabase
      .from("empresa_fiscal")
      .select("id")
      .eq("organization_id", organizationId)
      .maybeSingle()

    let error
    if (existing) {
      const res = await supabase
        .from("empresa_fiscal")
        .update(data)
        .eq("organization_id", organizationId)
      error = res.error
    } else {
      const res = await supabase.from("empresa_fiscal").insert({
        user_id: user.id,
        organization_id: organizationId,
        ...data,
      })
      error = res.error
    }

    if (error) fail(error.message)

    const displayName =
      data.nombre_comercial || data.razon_social || organization?.name
    if (displayName && organization?.id && role === "owner") {
      await supabase
        .from("organizations")
        .update({ name: displayName })
        .eq("id", organizationId)
    }

    revalidateNegocio()
    redirect(`${BASE}?ok=guardado`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message ?? "Error al guardar.")
  }
}

/** Compat: facturación puede redirigir aquí en el futuro. */
export async function guardarEmpresaFiscal(formData) {
  return guardarNegocio(formData)
}
