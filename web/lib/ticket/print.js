import config from "@/config"

/**
 * Perfil de impresión Epson TM-T20II (papel térmico 80 mm).
 * @see https://files.support.epson.com/pdf/pos/bulk/tm-t20ii_pig.pdf
 *
 * - Rollo: 79.5 mm ± 0.5
 * - Área imprimible: 72 mm (576 dots @ 203 dpi)
 * - Fuente A: ~48 caracteres por línea en 80 mm
 */
export const TM_T20II_80MM = {
  model: "Epson TM-T20II",
  paperWidthMm: 80,
  rollWidthMm: 79.5,
  printWidthMm: 72,
  charsPerLine: 48,
  pageMarginMm: 0,
  sideInsetMm: 0,
  paddingTopMm: 0,
  paddingBottomMm: 0,
  paddingHorizontalMm: 0,
  fontFamily: '"Courier New", Courier, "Liberation Mono", monospace',
  fontSizePt: 9,
  fontSizeSmallPt: 8,
  fontSizeTitlePt: 10,
  fontSizeTotalPt: 10,
  lineHeight: 1.2,
  autoPrintDelayMs: 600,
}

/** Config efectiva (config.js → fallback TM-T20II 80 mm). */
export function getTicketPrintConfig() {
  const fromConfig = config.ticket?.printer ?? {}
  return { ...TM_T20II_80MM, ...fromConfig }
}

export function getTicketPrintCssVars() {
  const p = getTicketPrintConfig()
  const sideInset = p.sideInsetMm ?? 0
  return {
    "--ticket-paper-width": `${p.paperWidthMm}mm`,
    "--ticket-print-width": `${p.printWidthMm}mm`,
    "--ticket-side-inset": `${sideInset}mm`,
    "--ticket-padding-top": `${p.paddingTopMm}mm`,
    "--ticket-padding-bottom": `${p.paddingBottomMm}mm`,
    "--ticket-padding-x": `${p.paddingHorizontalMm}mm`,
    "--ticket-font-family": p.fontFamily,
    "--ticket-font-size": `${p.fontSizePt}pt`,
    "--ticket-font-size-sm": `${p.fontSizeSmallPt}pt`,
    "--ticket-font-size-title": `${p.fontSizeTitlePt}pt`,
    "--ticket-font-size-total": `${p.fontSizeTotalPt}pt`,
    "--ticket-line-height": String(p.lineHeight),
    "--ticket-ch-width": `${p.printWidthMm / p.charsPerLine}mm`,
  }
}

export const TICKET_PRINT_ROOT_CLASS = "ticket-print-mode"
export const TICKET_PAPER_CLASS = "ticket-paper"
export const TICKET_PRINT_AREA_ID = "ticket-print"

/** Texto corto para el diálogo de impresión del navegador. */
export function ticketPrintSetupHint() {
  const p = getTicketPrintConfig()
  return `Impresora ${p.model}: papel ${p.paperWidthMm} mm, márgenes ninguno, escala 100%. En Windows/Chrome desactiva encabezado y pie de página.`
}
