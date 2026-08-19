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
  printWidthMm: 66,
  charsPerLine: 42,
  pageMarginMm: 0,
  /** Ajuste izquierdo del cabezal (Windows suele necesitar 7–9 mm). */
  sideInsetMm: 4,
  printOffsetLeftMm: 8,
  /** Zona no imprimible derecha del cabezal (~4 mm en rollo 80 mm). */
  printOffsetRightMm: 4,
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

/** Redondea mm a 1 decimal (Chrome rechaza más precisión en márgenes). */
export function formatTicketMm(value) {
  const n = Math.round(Number(value) * 10) / 10
  return Number.isInteger(n) ? String(Math.trunc(n)) : String(n)
}

export function mmCss(value) {
  return `${formatTicketMm(value)}mm`
}

/** Config efectiva (config.js → fallback TM-T20II 80 mm). */
export function getTicketPrintConfig() {
  const fromConfig = config.ticket?.printer ?? {}
  return { ...TM_T20II_80MM, ...fromConfig }
}

export function getTicketPrintCssVars() {
  const p = getTicketPrintConfig()
  const inset = p.sideInsetMm ?? 4
  const offsetLeft = p.printOffsetLeftMm ?? inset
  const offsetRight = p.printOffsetRightMm ?? inset
  return {
    "--ticket-paper-width": mmCss(p.paperWidthMm),
    "--ticket-print-width": mmCss(p.printWidthMm),
    "--ticket-offset-left": mmCss(offsetLeft),
    "--ticket-offset-right": mmCss(offsetRight),
    "--ticket-amount-padding": mmCss(2),
    "--ticket-side-inset": mmCss(inset),
    "--ticket-padding-top": mmCss(p.paddingTopMm),
    "--ticket-padding-bottom": mmCss(p.paddingBottomMm),
    "--ticket-padding-x": mmCss(p.paddingHorizontalMm),
    "--ticket-font-family": p.fontFamily,
    "--ticket-font-size": `${p.fontSizePt}pt`,
    "--ticket-font-size-sm": `${p.fontSizeSmallPt}pt`,
    "--ticket-font-size-title": `${p.fontSizeTitlePt}pt`,
    "--ticket-font-size-total": `${p.fontSizeTotalPt}pt`,
    "--ticket-line-height": String(p.lineHeight),
  }
}

export const TICKET_PRINT_ROOT_CLASS = "ticket-print-mode"
export const TICKET_PAPER_CLASS = "ticket-paper"
export const TICKET_PRINT_AREA_ID = "ticket-print"
