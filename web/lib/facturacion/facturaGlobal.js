import { calcularTotalesDesdePreciosConIva, generarCfdiXml } from "@/lib/cfdi"
import { timbrarCfdi } from "@/lib/pac/sandbox"
import {
  CLIENTE_PUBLICO_GENERAL_DEFAULTS,
  ensureClientePublicoGeneral,
  PUBLICO_GENERAL_RFC,
} from "@/lib/clientes/publicoGeneral"
import { mexicoDayBounds, formatFechaMexico } from "@/lib/fechas/mexico"

function ventaEsPublicoGeneral(venta) {
  if (!venta.cliente_id) return true
  const c = venta.cliente
  if (!c) return true
  return c.es_publico_general || c.rfc === PUBLICO_GENERAL_RFC
}

/** Agrupa líneas de venta por producto/código para el CFDI global. */
export function agregarConceptosDesdeVentas(ventas) {
  const map = new Map()

  for (const venta of ventas) {
    for (const item of venta.items ?? []) {
      const key = item.producto_id || `${item.codigo}-${item.nombre}`
      const prev = map.get(key)
      if (prev) {
        prev.cantidad += item.cantidad
        prev.subtotal = round2(prev.subtotal + Number(item.subtotal))
      } else {
        map.set(key, {
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio_unitario: Number(item.precio_unitario),
          subtotal: Number(item.subtotal),
          clave_sat: "01010101",
          unidad_sat: "H87",
        })
      }
    }
  }

  return [...map.values()]
}

function formaPagoPredominante(ventas) {
  const counts = new Map()
  for (const v of ventas) {
    const fp = v.forma_pago || "01"
    counts.set(fp, (counts.get(fp) ?? 0) + 1)
  }
  let best = "01"
  let max = 0
  for (const [fp, n] of counts) {
    if (n > max) {
      max = n
      best = fp
    }
  }
  return counts.size > 1 ? "99" : best
}

function informacionGlobalFromFecha(fecha) {
  const [y, m] = fecha.split("-")
  return {
    periodicidad: "01",
    meses: m.padStart(2, "0"),
    anio: y,
  }
}

function round2(n) {
  return Math.round(n * 100) / 100
}

/**
 * Genera factura global CFDI del día a público en general.
 */
export async function generarFacturaGlobalDelDia({
  supabase,
  userId,
  organizationId,
  fecha,
  timbrar = false,
}) {
  const { fecha: day, desde, hasta } = mexicoDayBounds(fecha)

  const { data: empresa } = await supabase
    .from("empresa_fiscal")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle()

  if (!empresa?.rfc || !empresa?.razon_social) {
    throw new Error("Configura los datos fiscales en Mi negocio.")
  }

  const { data: existingGlobal } = await supabase
    .from("facturas")
    .select("id, folio, serie")
    .eq("organization_id", organizationId)
    .eq("es_global", true)
    .eq("periodo_fecha", day)
    .maybeSingle()

  if (existingGlobal) {
    throw new Error(
      `Ya existe factura global del ${formatFechaMexico(desde)} (folio ${existingGlobal.serie}-${existingGlobal.folio}).`
    )
  }

  const { data: ventasRaw, error: vErr } = await supabase
    .from("ventas")
    .select("*, items:venta_items(*), cliente:clientes(id, rfc, es_publico_general)")
    .eq("organization_id", organizationId)
    .is("factura_id", null)
    .gte("created_at", desde)
    .lte("created_at", hasta)
    .order("folio", { ascending: true })

  if (vErr) throw new Error(vErr.message)

  const ventas = (ventasRaw ?? []).filter(ventaEsPublicoGeneral)

  if (!ventas.length) {
    throw new Error(
      `No hay ventas al público sin facturar el ${formatFechaMexico(desde)}.`
    )
  }

  const publico = await ensureClientePublicoGeneral(
    supabase,
    organizationId,
    userId,
    empresa.codigo_postal
  )

  const conceptos = agregarConceptosDesdeVentas(ventas)
  if (!conceptos.length) {
    throw new Error("Las ventas del día no tienen productos.")
  }

  const formaPago = formaPagoPredominante(ventas)
  const metodoPago = ventas.every((v) => v.metodo_pago === "PUE") ? "PUE" : "PUE"
  const folio = empresa.folio_actual
  const serie = empresa.serie_factura || "A"

  const receptor = {
    nombre: CLIENTE_PUBLICO_GENERAL_DEFAULTS.razon_social,
    rfc: CLIENTE_PUBLICO_GENERAL_DEFAULTS.rfc,
    regimen_fiscal: CLIENTE_PUBLICO_GENERAL_DEFAULTS.regimen_fiscal,
    codigo_postal: publico.codigo_postal || empresa.codigo_postal,
    uso_cfdi: CLIENTE_PUBLICO_GENERAL_DEFAULTS.uso_cfdi,
  }

  const xml = generarCfdiXml({
    emisor: empresa,
    receptor,
    conceptos,
    serie,
    folio,
    formaPago,
    metodoPago,
    usoCfdi: receptor.uso_cfdi,
    informacionGlobal: informacionGlobalFromFecha(day),
  })

  const { subtotal, iva, total } = calcularTotalesDesdePreciosConIva(conceptos)

  let estado = "pendiente"
  let uuid_cfdi = null
  let xml_final = xml
  let pac_response = null
  let timbrado_at = null

  if (timbrar) {
    const timbre = await timbrarCfdi({ xml, empresa })
    if (!timbre.ok) throw new Error(timbre.error || "Error al timbrar.")
    estado = "timbrada"
    uuid_cfdi = timbre.uuid_cfdi
    xml_final = timbre.xml_timbrado ?? xml
    pac_response = timbre.pac_response
    timbrado_at = new Date().toISOString()
  }

  const { data: factura, error: fErr } = await supabase
    .from("facturas")
    .insert({
      user_id: userId,
      organization_id: organizationId,
      venta_id: null,
      cliente_id: publico.id,
      serie,
      folio,
      uuid_cfdi,
      rfc_emisor: empresa.rfc,
      rfc_receptor: receptor.rfc,
      subtotal,
      iva,
      total,
      uso_cfdi: receptor.uso_cfdi,
      forma_pago: formaPago,
      metodo_pago: metodoPago,
      estado,
      xml_cfdi: xml_final,
      pac_response,
      timbrado_at,
      es_global: true,
      periodo_fecha: day,
      ventas_incluidas: ventas.length,
    })
    .select("id, folio, estado, serie, total, ventas_incluidas")
    .single()

  if (fErr) throw new Error(fErr.message)

  const ventaIds = ventas.map((v) => v.id)
  const { error: linkErr } = await supabase
    .from("ventas")
    .update({ factura_id: factura.id })
    .in("id", ventaIds)
    .eq("organization_id", organizationId)

  if (linkErr) throw new Error(linkErr.message)

  await supabase
    .from("empresa_fiscal")
    .update({ folio_actual: folio + 1 })
    .eq("organization_id", organizationId)

  return { factura, ventasCount: ventas.length, fecha: day }
}

/** Resumen de ventas público pendientes de facturar en un día. */
export async function resumenVentasGlobalPendientes(
  supabase,
  organizationId,
  fecha
) {
  const { fecha: day, desde, hasta } = mexicoDayBounds(fecha)

  const [{ data: ventas }, { data: globalFactura }] = await Promise.all([
    supabase
      .from("ventas")
      .select("id, folio, total, cliente_id, cliente:clientes(rfc, es_publico_general)")
      .eq("organization_id", organizationId)
      .is("factura_id", null)
      .gte("created_at", desde)
      .lte("created_at", hasta),
    supabase
      .from("facturas")
      .select("id, folio, serie, total, estado")
      .eq("organization_id", organizationId)
      .eq("es_global", true)
      .eq("periodo_fecha", day)
      .maybeSingle(),
  ])

  const pendientes = (ventas ?? []).filter(ventaEsPublicoGeneral)
  const totalPendiente = pendientes.reduce((s, v) => s + Number(v.total), 0)

  return {
    fecha: day,
    pendientes: pendientes.length,
    totalPendiente: round2(totalPendiente),
    yaFacturadoGlobal: Boolean(globalFactura),
    facturaGlobal: globalFactura,
  }
}
