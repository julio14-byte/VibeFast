import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
} from "@react-email/components"
import config from "@/config"

export default function CfdiFactura({
  emisorNombre = "",
  receptorNombre = "",
  serie = "A",
  folio = 0,
  totalFmt = "",
  uuid = "",
  downloadUrl = "",
}) {
  const appName = config.app.name

  return (
    <Html lang={config.app.locale}>
      <Head />
      <Preview>
        Factura {serie}-{folio} · {totalFmt}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Factura electrónica (CFDI)</Heading>
          <Text style={text}>
            Hola {receptorNombre || "cliente"},
          </Text>
          <Text style={text}>
            {emisorNombre || appName} te envía tu comprobante fiscal digital.
          </Text>
          <Section style={box}>
            <Text style={label}>Serie / Folio</Text>
            <Text style={value}>{serie}-{folio}</Text>
            <Text style={label}>Total</Text>
            <Text style={value}>{totalFmt}</Text>
            {uuid && (
              <>
                <Text style={label}>UUID (CFDI)</Text>
                <Text style={valueSmall}>{uuid}</Text>
              </>
            )}
          </Section>
          <Text style={text}>
            El archivo XML del CFDI va adjunto a este correo. Guárdalo para
            tus registros contables.
          </Text>
          {downloadUrl && (
            <Button style={button} href={downloadUrl}>
              Descargar XML
            </Button>
          )}
          <Text style={footer}>
            {appName} · Facturación electrónica SAT
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
const container = { margin: "0 auto", padding: "32px 16px", maxWidth: "520px" }
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
const valueSmall = {
  fontSize: "12px",
  fontFamily: "monospace",
  color: "#475569",
  margin: 0,
}
const button = {
  backgroundColor: "#D97706",
  color: "#fff",
  padding: "12px 20px",
  borderRadius: "8px",
  fontWeight: "600",
  textDecoration: "none",
}
const footer = { fontSize: "12px", color: "#94a3b8", marginTop: "24px" }
