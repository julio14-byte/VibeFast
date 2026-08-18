/** Catálogos SAT usados en clientes, facturación y CFDI. */

export const SAT_FORMAS_PAGO = [
  { clave: "01", nombre: "Efectivo" },
  { clave: "02", nombre: "Cheque nominativo" },
  { clave: "03", nombre: "Transferencia electrónica de fondos" },
  { clave: "04", nombre: "Tarjeta de crédito" },
  { clave: "05", nombre: "Monedero electrónico" },
  { clave: "06", nombre: "Dinero electrónico" },
  { clave: "08", nombre: "Vales de despensa" },
  { clave: "28", nombre: "Tarjeta de débito" },
  { clave: "29", nombre: "Tarjeta de servicios" },
  { clave: "99", nombre: "Por definir" },
]

export const SAT_USOS_CFDI = [
  { clave: "G01", nombre: "Adquisición de mercancías" },
  { clave: "G02", nombre: "Devoluciones, descuentos o bonificaciones" },
  { clave: "G03", nombre: "Gastos en general" },
  { clave: "I01", nombre: "Construcciones" },
  { clave: "I02", nombre: "Mobiliario y equipo de oficina por inversiones" },
  { clave: "I03", nombre: "Equipo de transporte" },
  { clave: "I04", nombre: "Equipo de cómputo y accesorios" },
  { clave: "I08", nombre: "Otra maquinaria y equipo" },
  { clave: "D01", nombre: "Honorarios médicos, dentales y gastos hospitalarios" },
  { clave: "D02", nombre: "Gastos médicos por incapacidad o discapacidad" },
  { clave: "D03", nombre: "Gastos funerales" },
  { clave: "D04", nombre: "Donativos" },
  { clave: "D05", nombre: "Intereses reales efectivamente pagados por créditos hipotecarios" },
  { clave: "D06", nombre: "Aportaciones voluntarias al SAR" },
  { clave: "D07", nombre: "Primas por seguros de gastos médicos" },
  { clave: "D08", nombre: "Gastos de transportación escolar obligatoria" },
  { clave: "D10", nombre: "Pagos por servicios educativos" },
  { clave: "S01", nombre: "Sin efectos fiscales" },
  { clave: "CP01", nombre: "Pagos" },
  { clave: "CN01", nombre: "Nómina" },
  { clave: "P01", nombre: "Por definir" },
]

export const SAT_REGIMENES = [
  { clave: "601", nombre: "General de Ley Personas Morales" },
  { clave: "603", nombre: "Personas Morales con Fines no Lucrativos" },
  { clave: "605", nombre: "Sueldos y Salarios e Ingresos Asimilados a Salarios" },
  { clave: "606", nombre: "Arrendamiento" },
  { clave: "607", nombre: "Régimen de Enajenación o Adquisición de Bienes" },
  { clave: "608", nombre: "Demás ingresos" },
  { clave: "610", nombre: "Residentes en el Extranjero sin Establecimiento Permanente en México" },
  { clave: "611", nombre: "Ingresos por Dividendos (socios y accionistas)" },
  { clave: "612", nombre: "Personas Físicas con Actividades Empresariales y Profesionales" },
  { clave: "614", nombre: "Ingresos por intereses" },
  { clave: "615", nombre: "Régimen de los ingresos por obtención de premios" },
  { clave: "616", nombre: "Sin obligaciones fiscales" },
  { clave: "620", nombre: "Sociedades Cooperativas de Producción que optan por diferir sus ingresos" },
  { clave: "621", nombre: "Incorporación Fiscal" },
  { clave: "622", nombre: "Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras" },
  { clave: "623", nombre: "Opcional para Grupos de Sociedades" },
  { clave: "624", nombre: "Coordinados" },
  { clave: "625", nombre: "Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas" },
  { clave: "626", nombre: "Régimen Simplificado de Confianza" },
  { clave: "628", nombre: "Hidrocarburos" },
  { clave: "629", nombre: "De los Regímenes Fiscales Preferentes y de las Empresas Multinacionales" },
  { clave: "630", nombre: "Enajenación de acciones en bolsa de valores" },
]

/** Uso CFDI recomendado para ventas diarias al público (mostrador). */
export const USO_CFDI_PUBLICO_GENERAL = "S01"
