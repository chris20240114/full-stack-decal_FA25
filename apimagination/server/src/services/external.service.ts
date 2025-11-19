// server/src/services/external.service.ts
import axios from "axios"

type Opts = { lat?: number; lon?: number; km?: number }

// A few public mirrors. If one 504s, we try the next.
const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
]

// Treat these as broad searches (don’t filter by name too aggressively)
const GENERIC = new Set([
  "coffee",
  "cafe",
  "café",
  "tea",
  "boba",
  "espresso",
  "latte",
  "bubble tea",
])

export async function searchCafes(q: string, opts?: Opts) {
  const lat = opts?.lat ?? 37.8715   // Berkeley
  const lon = opts?.lon ?? -122.2730
  const km  = Math.min(Math.max(opts?.km ?? 2, 0.5), 5) // clamp 0.5–5km

  const term = (q || "").trim()
  const isGeneric = term.length === 0 || GENERIC.has(term.toLowerCase())

  try {
    // Pass 1: specific name search (for things like "insomnia", "peet's", etc.)
    if (!isGeneric) {
      const pass1 = await runOverpass({
        lat,
        lon,
        km: Math.min(km, 1.5), // smaller radius for precise name queries
        name: term,
        anyAmenity: true,      // ✅ ignore amenity, just match name
      })

      if (pass1.length > 0) return pass1
    }

    // Pass 2: broad cafés / food spots nearby
    return await runOverpass({
      lat,
      lon,
      km,
      anyAmenity: false,       // ✅ restrict to food-ish places
    })
  } catch (err) {
    console.error("Overpass search failed:", err)
    // Fail gracefully instead of crashing the route
    return []
  }
}

type RunOpts = {
  lat: number
  lon: number
  km: number
  name?: string
  anyAmenity?: boolean
}

async function runOverpass({ lat, lon, km, name, anyAmenity }: RunOpts) {
  const radius = Math.round(km * 1000)
  const safeName = name ? escapeRe(name) : null

  const nameFilter = safeName ? `["name"~"${safeName}", i]` : ""

  let body: string

  if (safeName && anyAmenity) {
    // Name-only search, no amenity restriction
    body = `
      node${nameFilter}(around:${radius},${lat},${lon});
      way${nameFilter}(around:${radius},${lat},${lon});
    `
  } else {
    // Cafe-ish places: cafe / fast_food / restaurant / bakery
    const amenityFilter = `["amenity"~"^(cafe|fast_food|restaurant|bakery)$"]`

    body = `
      node${amenityFilter}${nameFilter}(around:${radius},${lat},${lon});
      way${amenityFilter}${nameFilter}(around:${radius},${lat},${lon});
    `
  }

  const query = `
    [out:json][timeout:20];
    (
      ${body}
    );
    out center tags qt 40;
  `.trim()

  const form = new URLSearchParams({ data: query })
  const axiosCfg = {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 8000 as const,
  }

  let lastErr: any

  for (const url of OVERPASS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { data } = await axios.post(url, form, axiosCfg)
        const elements = Array.isArray(data?.elements) ? data.elements : []
        return elements.map(normalizeCafe)
      } catch (err: any) {
        lastErr = err
        const status = err?.response?.status

        // Common transient statuses: 429, 502, 503, 504, or timeout
        if ([429, 502, 503, 504].includes(status) || err.code === "ECONNABORTED") {
          await sleep(400 + 300 * attempt)
          continue
        }

        // Other errors: try next mirror
        break
      }
    }
  }

  // If all mirrors fail, surface something meaningful
  throw lastErr ?? new Error("Overpass unavailable")
}

function normalizeCafe(el: any) {
  const tags = el.tags ?? {}
  const center = el.center ?? {}
  const lat = el.lat ?? center.lat
  const lon = el.lon ?? center.lon

  return {
    title: tags.name || "Unnamed Place",
    description: formatDesc(tags),
    thumbnailUrl: "", // filled by Yelp enrichment layer, if you keep that
    externalId: String(el.id),
    location: { lat, lon },
    address:
      tags["addr:full"] ||
      [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]]
        .filter(Boolean)
        .join(" "),
    source: "openstreetmap",
  }
}

function formatDesc(tags: any) {
  const cuisine = tags.cuisine ? `Cuisine: ${tags.cuisine}` : undefined
  const wifi = tags["internet_access"] ? `Wi-Fi: ${tags["internet_access"]}` : undefined
  const takeaway = tags.takeaway ? `Takeaway: ${tags.takeaway}` : undefined
  const hours = tags["opening_hours"] ? `Hours: ${tags["opening_hours"]}` : undefined

  return [wifi, takeaway, cuisine, hours].filter(Boolean).join(" · ") || "Food & drink"
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
