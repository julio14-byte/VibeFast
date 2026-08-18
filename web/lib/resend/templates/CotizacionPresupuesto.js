import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from "@react-email/components"
import config from "@/config"

export default function CotizacionPresupuesto({
  emisorNombre = "",
  receptorNombre = "",
  folio = 0,
  items = [],
  subtotalFmt = "",
  ivaFmt = "",
  totalFmt = "",
  validezDias = 7,
  venceFmt = "",
  notas = "",
}) {
  const appName = config.app.name

  return (
    <Html lang={config.app.locale}>
      <Head />
      <Preview>
        Cotización #{folio} · {totalFmt}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Cotización / presupuesto</Heading>
          <Text style={text}>
            Hola {receptorNombre || "cliente"},
          </Text>
          <Text style={text}>
            {emisorNombre || appName} te envía el siguiente presupuesto.
          </Text>

          <Section style={box}>
            <Text style={label}>Presupuesto</Text>
            <Text style={value}>#{folio}</Text>
            <Text style={label}>Válida</Text>
            <Text style={value}>
              {validezDias} días{venceFmt ? ` (hasta ${venceFmt})` : ""}
            </Text>
          </Section>

          <Section style={tableWrap}>
            <Row style={tableHead}>
              <Column style={colProducto}>Producto</Column>
              <Column style={colQty}>Cant.</Column>
              <Column style={colPrice}>P. unit.</Column>
              <Column style={colTotal}>Subtotal</Column>
            </Row>
            {items.map((item, i) => (
              <Row key={i} style={tableRow}>
                <Column style={colProducto}>
                  <Text style={itemName}>{item.nombre}</Text>
                  <Text style={itemCode}>cód. {item.codigo}</Text>
                </Column>
                <Column style={colQty}>{item.cantidad}</Column>
                <Column style={colPrice}>{item.precioFmt}</Column>
                <Column style={colTotal}>{item.subtotalFmt}</Column>
              </Row>
            ))}
          </Section>

          <Section style={totalsBox}>
            <Text style={totalLine}>
              Subtotal (sin IVA): <strong>{subtotalFmt}</strong>
            </Text>
            <Text style={totalLine}>
              IVA (16%): <strong>{ivaFmt}</strong>
            </Text>
            <Text style={totalGrand}>
              Total: <strong>{totalFmt}</strong>
            </Text>
          </Section>

          {notas?.trim() ? (
            <Text style={text}>
              <strong>Notas:</strong> {notas.trim()}
            </Text>
          ) : null}

          <Text style={footer}>
            {appName} · Cotización
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: "#f8fafc",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
}
const container = { margin: "0 auto", padding: "32px 16px", maxWidth: "560px" }
const h1 = { fontSize: "22px", fontWeight: "700", color: "#0f172a" }
const text = { fontSize: "15px", lineHeight: "1.6", color: "#334155" }
const box = {
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "16px",
  margin: "16px 0",
}
const label = {
  fontSize: "11px",
  fontWeight: "600",
  color: "#64748b",
  margin: "8px 0 2px",
  textTransform: "uppercase",
}
const value = { fontSize: "16px", fontWeight: "600", color: "#0f172a", margin: 0 }
const tableWrap = {
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "12px",
  margin: "16px 0",
}
const tableHead = { borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }
const tableRow = { borderBottom: "1px solid #f1f5f9", padding: "8px 0" }
const colProducto = { width: "46%", verticalAlign: "top" }
const colQty = { width: "12%", textAlign: "center", fontSize: "13px", color: "#334155" }
const colPrice = { width: "21%", textAlign: "right", fontSize: "13px", color: "#334155" }
const colTotal = { width: "21%", textAlign: "right", fontSize: "13px", fontWeight: "600", color: "#0f172a" }
const itemName = { fontSize: "13px", fontWeight: "600", color: "#0f172a", margin: "0 0 2px" }
const itemCode = { fontSize: "11px", color: "#64748b", margin: 0 }
const totalsBox = {
  backgroundColor: "#fffbeb",
  border: "1px solid #fde68a",
  borderRadius: "12px",
  padding: "16px",
  margin: "16px 0",
}
const totalLine = { fontSize: "14px", color: "#334155", margin: "4px 0" }
const totalGrand = { fontSize: "18px", color: "#0f172a", margin: "12px 0 0", fontWeight: "700" }
const footer = { fontSize: "12px", color: "#94a3b8", marginTop: "24px" }
