/**
 * Catálogos SAT (CFDI 4.0) desde repositorio público bambucode/catalogos_sat_JSON.
 * Carga lazy en memoria del servidor (primera búsqueda puede tardar unos segundos).
 */

const CLAVE_PRODSERV_URL =
  "https://raw.githubusercontent.com/bambucode/catalogos_sat_JSON/master/c_ClaveProdServ.json"
const CLAVE_UNIDAD_URL =
  "https://raw.githubusercontent.com/bambucode/catalogos_sat_JSON/master/c_ClaveUnidad.json"

const cache = {
  claveProdServ: null,
  claveUnidad: null,
  loading: { claveProdServ: false, claveUnidad: false },
}

function normalize(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

async function loadCatalog(key, url) {
  if (cache[key]) return cache[key]
  if (cache.loading[key]) {
    while (cache.loading[key]) {
      await new Promise((r) => setTimeout(r, 100))
    }
    return cache[key]
  }

  cache.loading[key] = true
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    })
    if (!res.ok) throw new Error(`Catálogo SAT (${key}): HTTP ${res.status}`)
    cache[key] = await res.json()
    return cache[key]
  } finally {
    cache.loading[key] = false
  }
}

function isVigente(item) {
  const fin = item?.fechaFinVigencia ?? item?.fechaDeFinDeVigencia ?? ""
  return !fin || String(fin).trim() === ""
}

export async function searchClaveProdServ(query, limit = 15) {
  const q = query?.trim()
  if (!q || q.length < 2) return []

  const catalog = await loadCatalog("claveProdServ", CLAVE_PRODSERV_URL)
  const terms = normalize(q).split(/\s+/).filter(Boolean)
  const isCode = /^\d+$/.test(q)

  const results = []
  for (const item of catalog) {
    if (!isVigente(item)) continue

    const id = String(item.id ?? "")
    const desc = String(item.descripcion ?? "")
    const similares = String(item.palabrasSimilares ?? "")

    let match = false
    if (isCode && id.startsWith(q)) match = true
    else {
      const haystack = normalize(`${id} ${desc} ${similares}`)
      match = terms.every((t) => haystack.includes(t))
    }

    if (match) {
      results.push({
        clave: id,
        descripcion: desc,
        palabrasSimilares: similares || null,
      })
      if (results.length >= limit) break
    }
  }

  return results
}

export async function searchClaveUnidad(query, limit = 15) {
  const q = query?.trim()
  if (!q) return []

  const catalog = await loadCatalog("claveUnidad", CLAVE_UNIDAD_URL)
  const terms = normalize(q).split(/\s+/).filter(Boolean)

  const results = []
  for (const item of catalog) {
    if (!isVigente(item)) continue

    const id = String(item.id ?? "")
    const nombre = String(item.nombre ?? item.descripcion ?? "")

    const haystack = normalize(`${id} ${nombre}`)
    const match = terms.every((t) => haystack.includes(t))

    if (match) {
      results.push({
        clave: id,
        nombre,
      })
      if (results.length >= limit) break
    }
  }

  return results
}

export async function getClaveUnidadById(clave) {
  if (!clave) return null
  const catalog = await loadCatalog("claveUnidad", CLAVE_UNIDAD_URL)
  const found = catalog.find((item) => String(item.id) === String(clave))
  if (!found) return null
  return {
    clave: String(found.id),
    nombre: String(found.nombre ?? found.descripcion ?? ""),
  }
}
