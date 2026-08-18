// Generación de CFDI 4.0 (estructura SAT) para facturación electrónica.
// El timbrado real requiere integración con un PAC certificado.

import { calcularTotalesPreciosConIva, desglosarPrecioConIva } from "./precios"

export function generarCfdiXml({
  emisor,
  receptor,
  conceptos,
  serie,
  folio,
  formaPago = "01",
  metodoPago = "PUE",
  usoCfdi = "G03",
  informacionGlobal = null,
}) {
  const lineasConIva = conceptos.map((c) => ({
    cantidad: c.cantidad,
    precio_unitario: c.precio_unitario,
  }))
  const { subtotal, iva, total } = calcularTotalesPreciosConIva(lineasConIva)
  const fecha = new Date().toISOString().slice(0, 19)

  const infoGlobalXml = informacionGlobal
    ? `\n  <cfdi:InformacionGlobal Periodicidad="${informacionGlobal.periodicidad}" Meses="${informacionGlobal.meses}" Año="${informacionGlobal.anio}"/>`
    : ""

  const conceptosXml = conceptos
    .map((c) => {
      const unitBase = desglosarPrecioConIva(c.precio_unitario).base
      const importeBase = round2(unitBase * c.cantidad)
      return `<cfdi:Concepto ClaveProdServ="${c.clave_sat}" Cantidad="${c.cantidad}" ClaveUnidad="${c.unidad_sat}" Descripcion="${escapeXml(c.nombre)}" ValorUnitario="${unitBase.toFixed(2)}" Importe="${importeBase.toFixed(2)}" ObjetoImp="02"/>`
    })
    .join("\n    ")

  return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Serie="${serie}" Folio="${folio}" Fecha="${fecha}" FormaPago="${formaPago}" MetodoPago="${metodoPago}" SubTotal="${subtotal.toFixed(2)}" Total="${total.toFixed(2)}" Moneda="MXN" TipoDeComprobante="I" Exportacion="01" LugarExpedicion="${emisor.codigo_postal}">${infoGlobalXml}
  <cfdi:Emisor Rfc="${emisor.rfc}" Nombre="${escapeXml(emisor.razon_social)}" RegimenFiscal="${emisor.regimen_fiscal}"/>
  <cfdi:Receptor Rfc="${receptor.rfc}" Nombre="${escapeXml(receptor.nombre)}" UsoCFDI="${usoCfdi}" DomicilioFiscalReceptor="${receptor.codigo_postal || emisor.codigo_postal}" RegimenFiscalReceptor="${receptor.regimen_fiscal}"/>
  <cfdi:Conceptos>
    ${conceptosXml}
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="${iva.toFixed(2)}">
    <cfdi:Traslados>
      <cfdi:Traslado Base="${subtotal.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${iva.toFixed(2)}"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
</cfdi:Comprobante>`
}

function escapeXml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function calcularTotales(items) {
  const subtotal = items.reduce(
    (s, i) => s + Number(i.subtotal ?? i.cantidad * i.precio_unitario),
    0
  )
  const iva = subtotal * 0.16
  return {
    subtotal: round2(subtotal),
    iva: round2(iva),
    total: round2(subtotal + iva),
  }
}

/** Totales cuando precio_unitario ya incluye IVA (catálogo y POS). */
export function calcularTotalesDesdePreciosConIva(items) {
  return calcularTotalesPreciosConIva(items)
}

export { desglosarPrecioConIva } from "./precios"

function round2(n) {
  return Math.round(n * 100) / 100
}
