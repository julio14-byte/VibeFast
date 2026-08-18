"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { parseCsv, mapCsvRowToProducto } from "@/lib/productos/csv"
import { normalizeCodigo } from "@/lib/productos/codigo"
import { margenesParaPersistir } from "@/lib/productos/margenes"
import { deleteDemoProductosForOrg, deleteAllProductosForOrg } from "@/lib/productos/queries"
import { canManageTeam, requireOrgContext } from "@/lib/organization/context"

const BASE = "/productos"
const IMPORT_BATCH = 200
const MAX_CSV_BYTES = 5 * 1024 * 1024
const MAX_CSV_ROWS = 10000

async function requireUser() {
  return requireOrgContext(BASE)
}

const CATALOGO_PATHS = ["/precios", "/productos", "/inventario"]

function safeReturnPath(raw, fallback) {
  const path = raw?.toString().trim()
  if (!path?.startsWith("/") || path.startsWith("//")) return fallback
  if (!CATALOGO_PATHS.some((p) => path === p || path.startsWith(`${p}?`))) {
    return fallback
  }
  return path
}

function revalidateCatalogo() {
  for (const p of CATALOGO_PATHS) revalidatePath(p)
  revalidatePath("/ventas")
  revalidatePath("/dashboard")
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
  const margenRaw = formData.get("margen_ganancia")?.toString().trim()
  const margenMayoreoRaw = formData.get("margen_mayoreo")?.toString().trim()
  const claveSat = formData.get("clave_sat")?.toString().trim() || "01010101"
  const unidadSat = formData.get("unidad_sat")?.toString().trim() || "H87"

  const codigo = normalizeCodigo(codigoRaw)
  const precio_compra = parseOptionalNumber(precioCompraRaw)
  const precio_mayoreo = parseOptionalNumber(precioMayoreoRaw)
  const precio_publico = precioPublicoRaw
    ? Number.parseFloat(precioPublicoRaw)
    : NaN
  const stock = stockRaw ? Number.parseInt(stockRaw, 10) : NaN
  const margenFromForm = margenRaw ? Number.parseFloat(margenRaw) : NaN
  const margenMayoreoFromForm = margenMayoreoRaw
    ? Number.parseFloat(margenMayoreoRaw)
    : NaN

  if (
    !nombre ||
    !codigo ||
    Number.isNaN(precio_publico) ||
    Number.isNaN(stock)
  ) {
    return null
  }
  if (
    precio_compra < 0 ||
    precio_mayoreo < 0 ||
    precio_publico < 0 ||
    stock < 0
  ) {
    return null
  }

  const calculated = margenesParaPersistir({
    precio_compra,
    precio_publico,
    precio_mayoreo,
  })

  const margen_ganancia = Number.isFinite(margenFromForm)
    ? margenFromForm
    : calculated.margen_ganancia
  const margen_mayoreo = Number.isFinite(margenMayoreoFromForm)
    ? margenMayoreoFromForm
    : calculated.margen_mayoreo

  if (
    margen_ganancia < -100 ||
    margen_ganancia > 99999999.99 ||
    margen_mayoreo < -100 ||
    margen_mayoreo > 99999999.99
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
    margen_ganancia,
    margen_mayoreo,
    stock,
    proveedor_id: null,
    clave_sat: claveSat,
    unidad_sat: unidadSat,
  }
}

function fail(message) {
  redirect(`${BASE}?error=${encodeURIComponent(message)}`)
}

export async function importProductosCsv(formData) {
  try {
    const { supabase, user, organizationId, organization } = await requireUser()
    const file = formData.get("file")
    const mode = formData.get("mode")?.toString() || "upsert"

    if (!file || typeof file === "string") {
      return { ok: false, error: "Selecciona un archivo CSV." }
    }

    if (file.size > MAX_CSV_BYTES) {
      return { ok: false, error: "El archivo supera 5 MB." }
    }

    const text = await file.text()
    const rows = parseCsv(text)

    if (!rows.length) {
      return { ok: false, error: "El CSV no tiene filas de datos." }
    }
    if (rows.length > MAX_CSV_ROWS) {
      return {
        ok: false,
        error: `Máximo ${MAX_CSV_ROWS} filas por importación.`,
      }
    }

    const payloads = []
    const rowErrors = []

    rows.forEach((row, index) => {
      const lineNumber = index + 2
      const mapped = mapCsvRowToProducto(row, lineNumber)
      if (!mapped.ok) {
        rowErrors.push(mapped.error)
        return
      }

      const d = mapped.data
      payloads.push({
        user_id: user.id,
        organization_id: organizationId,
        nombre: d.nombre,
        codigo: d.codigo,
        precio: d.precio_publico,
        precio_publico: d.precio_publico,
        precio_compra: d.precio_compra,
        precio_mayoreo: d.precio_mayoreo,
        stock: d.stock,
        proveedor_id: null,
        margen_ganancia: d.margen_ganancia,
        margen_mayoreo: d.margen_mayoreo,
        clave_sat: d.clave_sat,
        unidad_sat: d.unidad_sat,
      })
    })

    if (!payloads.length) {
      return {
        ok: false,
        error: rowErrors[0] ?? "No hay filas válidas en el CSV.",
      }
    }

    if (organization?.product_limit) {
      const { count: currentCount } = await supabase
        .from("productos")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)

      const projected = (currentCount ?? 0) + payloads.length
      if (projected > organization.product_limit) {
        return {
          ok: false,
          error: `Tu plan permite hasta ${organization.product_limit} productos. Tendrías ${projected}. Mejora tu plan en Facturación.`,
        }
      }
    }

    let creados = 0
    let actualizados = 0

    for (let i = 0; i < payloads.length; i += IMPORT_BATCH) {
      const batch = payloads.slice(i, i + IMPORT_BATCH)

      if (mode === "insert") {
        const { data, error } = await supabase
          .from("productos")
          .upsert(batch, {
            onConflict: "organization_id,codigo",
            ignoreDuplicates: true,
          })
          .select("id")

        if (error) {
          return { ok: false, error: error.message }
        }
        creados += data?.length ?? 0
      } else {
        const codigos = batch.map((b) => b.codigo)
        const { data: existentes } = await supabase
          .from("productos")
          .select("codigo")
          .eq("organization_id", organizationId)
          .in("codigo", codigos)

        const existSet = new Set((existentes ?? []).map((e) => e.codigo))
        const batchActualizados = batch.filter((b) => existSet.has(b.codigo)).length
        const batchCreados = batch.length - batchActualizados

        const { error } = await supabase.from("productos").upsert(batch, {
          onConflict: "organization_id,codigo",
        })

        if (error) {
          return { ok: false, error: error.message }
        }

        creados += batchCreados
        actualizados += batchActualizados
      }
    }

    revalidateCatalogo()

    return {
      ok: true,
      creados,
      actualizados,
      errores: rowErrors.length,
      errorSamples: rowErrors.slice(0, 5),
    }
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    return { ok: false, error: err?.message ?? "Error al importar." }
  }
}

export async function createProducto(formData) {
  try {
    const data = parseProductoForm(formData)
    if (!data) fail("Revisa código, nombre, precios y stock.")

    const { supabase, user, organizationId } = await requireUser()
    const { error } = await supabase.from("productos").insert({
      user_id: user.id,
      organization_id: organizationId,
      ...data,
    })

    if (error) {
      if (error.code === "23505") fail(`Ya existe código "${data.codigo}".`)
      fail(error.message || "No se pudo crear el producto.")
    }

    revalidateCatalogo()
    const returnTo = safeReturnPath(
      formData.get("return_to"),
      `${BASE}?ok=creado`
    )
    redirect(returnTo.includes("?") ? `${returnTo}&ok=creado` : `${returnTo}?ok=creado`)
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

    const { supabase, organizationId } = await requireUser()
    const { error } = await supabase
      .from("productos")
      .update(data)
      .eq("id", id)
      .eq("organization_id", organizationId)

    if (error) {
      if (error.code === "23505") fail(`Ya existe código "${data.codigo}".`)
      fail(error.message || "No se pudo actualizar.")
    }

    revalidateCatalogo()
    const returnTo = safeReturnPath(
      formData.get("return_to"),
      `${BASE}?ok=actualizado`
    )
    redirect(
      returnTo.includes("?")
        ? `${returnTo}&ok=actualizado`
        : `${returnTo}?ok=actualizado`
    )
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message || "Error al actualizar.")
  }
}

export async function deleteAllProductos(formData) {
  try {
    const ctx = await requireUser()
    if (!canManageTeam(ctx.role)) {
      return { ok: false, error: "Solo el dueño o administrador puede vaciar el catálogo." }
    }

    const confirm = formData.get("confirm")?.toString().trim()
    if (confirm !== "VACIAR") {
      return { ok: false, error: 'Escribe VACIAR para confirmar.' }
    }

    const result = await deleteAllProductosForOrg(ctx.supabase, ctx.organizationId)

    if (result.error) {
      return { ok: false, error: result.error }
    }

    revalidateCatalogo()
    return { ok: true, eliminados: result.eliminados }
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    return { ok: false, error: err?.message ?? "Error al vaciar catálogo." }
  }
}

export async function deleteDemoProductos() {
  try {
    const { supabase, organizationId } = await requireUser()
    const result = await deleteDemoProductosForOrg(supabase, organizationId)

    if (result.error) {
      return { ok: false, error: result.error }
    }

    revalidateCatalogo()
    return { ok: true, eliminados: result.eliminados }
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    return { ok: false, error: err?.message ?? "Error al eliminar demo." }
  }
}

export async function deleteProducto(formData) {
  try {
    const id = formData.get("id")?.toString()
    if (!id) fail("Falta el id.")

    const { supabase, organizationId } = await requireUser()
    const { error } = await supabase
      .from("productos")
      .delete()
      .eq("id", id)
      .eq("organization_id", organizationId)

    if (error) fail(error.message || "No se pudo eliminar.")

    revalidateCatalogo()
    redirect(`${BASE}?ok=eliminado`)
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    fail(err?.message || "Error al eliminar.")
  }
}