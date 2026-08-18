import {
  SAT_REGIMENES,
  USO_CFDI_PUBLICO_GENERAL,
} from "@/lib/sat/catalogos"

export const PUBLICO_GENERAL_RFC = "XAXX010101000"

export const CLIENTE_PUBLICO_GENERAL_DEFAULTS = {
  nombre: "Público en general",
  razon_social: "PUBLICO EN GENERAL",
  rfc: PUBLICO_GENERAL_RFC,
  regimen_fiscal: "616",
  uso_cfdi: USO_CFDI_PUBLICO_GENERAL,
  usa_precio_mayoreo: false,
  es_publico_general: true,
}

/**
 * Garantiza un cliente «Público en general» por tienda (SAT XAXX010101000).
 */
export async function ensureClientePublicoGeneral(supabase, userId, codigoPostal) {
  const { data: flagged } = await supabase
    .from("clientes")
    .select("*")
    .eq("user_id", userId)
    .eq("es_publico_general", true)
    .maybeSingle()

  if (flagged) {
    if (codigoPostal && flagged.codigo_postal !== codigoPostal) {
      await supabase
        .from("clientes")
        .update({ codigo_postal: codigoPostal })
        .eq("id", flagged.id)
      return { ...flagged, codigo_postal: codigoPostal }
    }
    return flagged
  }

  const { data: byRfc } = await supabase
    .from("clientes")
    .select("*")
    .eq("user_id", userId)
    .eq("rfc", PUBLICO_GENERAL_RFC)
    .maybeSingle()

  if (byRfc) {
    const patch = {
      ...CLIENTE_PUBLICO_GENERAL_DEFAULTS,
      codigo_postal: codigoPostal ?? byRfc.codigo_postal ?? "00000",
    }
    await supabase.from("clientes").update(patch).eq("id", byRfc.id)
    return { ...byRfc, ...patch }
  }

  const { data: created, error } = await supabase
    .from("clientes")
    .insert({
      user_id: userId,
      ...CLIENTE_PUBLICO_GENERAL_DEFAULTS,
      codigo_postal: codigoPostal ?? "00000",
      email: null,
      telefono: null,
      direccion: null,
    })
    .select("*")
    .single()

  if (error) throw new Error(error.message)
  return created
}

export function regimenFiscalLabel(clave) {
  return SAT_REGIMENES.find((r) => r.clave === clave)?.nombre ?? clave
}
