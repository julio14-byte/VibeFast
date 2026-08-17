import { calcularTotalesDesdePreciosConIva, generarCfdiXml } from "@/lib/cfdi"
import { timbrarCfdi } from "@/lib/pac/sandbox"

function mapCliente(c, empresaCp) {
  return {
    nombre: c.razon_social ?? c.nombre,
    rfc: c.rfc,
    regimen_fiscal: c.regimen_fiscal,
    codigo_postal: c.codigo_postal || empresaCp,
    direccion: c.direccion,
    uso_cfdi: c.uso_cfdi,
    email: c.email,
  }
}

/**
 * Genera factura CFDI desde una venta (usado por facturación y cotizaciones).
 */
export async function generarFacturaInterna({
  supabase,
  userId,
  ventaId,
  clienteId = null,
  timbrar = false,
}) {
  const { data: empresa } = await supabase
    .from("empresa_fiscal")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (!empresa?.rfc || !empresa?.razon_social) {
    throw new Error("Configura los datos fiscales del emisor en Facturas.")
  }

  const { data: venta, error: vErr } = await supabase
    .from("ventas")
    .select("*, items:venta_items(*)")
    .eq("id", ventaId)
    .eq("user_id", userId)
    .single()

  if (vErr || !venta) throw new Error("Venta no encontrada.")

  let cliente = {
    nombre: "Público en general",
    rfc: "XAXX010101000",
    regimen_fiscal: "616",
    codigo_postal: empresa.codigo_postal,
    uso_cfdi: "S01",
  }

  if (clienteId) {
    const { data: c } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", clienteId)
      .eq("user_id", userId)
      .single()
    if (c) cliente = mapCliente(c, empresa.codigo_postal)
  }

  const folio = empresa.folio_actual
  const serie = empresa.serie_factura || "A"

  const conceptos = (venta.items ?? []).map((item) => ({
    nombre: item.nombre,
    cantidad: item.cantidad,
    precio_unitario: Number(item.precio_unitario),
    subtotal: Number(item.subtotal),
    clave_sat: "01010101",
    unidad_sat: "H87",
  }))

  const xml = generarCfdiXml({
    emisor: empresa,
    receptor: cliente,
    conceptos,
    serie,
    folio,
    formaPago: venta.forma_pago,
    metodoPago: venta.metodo_pago,
    usoCfdi: cliente.uso_cfdi,
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
      venta_id: venta.id,
      cliente_id: clienteId,
      serie,
      folio,
      uuid_cfdi,
      rfc_emisor: empresa.rfc,
      rfc_receptor: cliente.rfc,
      subtotal,
      iva,
      total,
      uso_cfdi: cliente.uso_cfdi,
      forma_pago: venta.forma_pago,
      metodo_pago: venta.metodo_pago,
      estado,
      xml_cfdi: xml_final,
      pac_response,
      timbrado_at,
    })
    .select("id, folio, estado, serie")
    .single()

  if (fErr) throw new Error(fErr.message)

  await supabase
    .from("empresa_fiscal")
    .update({ folio_actual: folio + 1 })
    .eq("user_id", userId)

  return factura
}
