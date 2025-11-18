import axios from "axios"

type Opts = { lat?: number; lon?: number; km?: number }

// A few public mirrors. If one 504s, we try the next.
const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
]

// Treat these as broad searches (don’t filter by name)
const GENERIC = new Set(["coffee", "cafe", "café", "tea", "boba", "espresso", "latte"])

/** Public entry: search nearby cafés, optionally by name. */
export async function searchCafes(q: string, opts?: Opts) {
  const lat = opts?.lat ?? 37.8715   // Berkeley
  const lon = opts?.lon ?? -122.2730
  const km  = Math.min(Math.max(opts?.km ?? 2, 0.5), 5) // clamp 0.5–5km

  const term = (q || "").trim()
  const isGeneric = term.length === 0 || GENERIC.has(term.toLowerCase())

  // Pass 1: specific name search (if not generic)
  if (!isGeneric) {
    let pass1 = await runOverpass({ lat, lon, km, name: term })
    pass1 = await maybeEnrichWithYelp(pass1, { lat, lon, km })
    if (pass1.length > 0) return pass1
  }

  // Pass 2: broad cafés nearby
  const pass2 = await runOverpass({ lat, lon, km })
  return await maybeEnrichWithYelp(pass2, { lat, lon, km })
}

async function runOverpass({ lat, lon, km, name }: { lat: number; lon: number; km: number; name?: string }) {
  // Keep the query cheap: radius + amenity=cafe + optional name filter
  const nameFilter = name ? `["name"~"${escapeRe(name)}", i]` : ""
  const radius = Math.round(km * 1000)

  const query = `
    [out:json][timeout:20];
    (
      node["amenity"="cafe"]${nameFilter}(around:${radius},${lat},${lon});
      way["amenity"="cafe"]${nameFilter}(around:${radius},${lat},${lon});
    );
    out center tags qt 50;
  `.trim()

  // Try mirrors with retry/backoff
  const body = new URLSearchParams({ data: query })
  const axiosCfg = { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 8000 as const }

  let lastErr: any
  for (const url of OVERPASS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { data } = await axios.post(url, body, axiosCfg)
        const elements = Array.isArray(data?.elements) ? data.elements : []
        return elements.map(normalizeCafe)
      } catch (err: any) {
        lastErr = err
        // Common transient statuses: 429, 502, 503, 504 — backoff then retry/next mirror
        const status = err?.response?.status
        if ([429, 502, 503, 504].includes(status) || err.code === "ECONNABORTED") {
          await sleep(400 + 300 * attempt)
          continue
        }
        // other errors: try next mirror
        break
      }
    }
  }
  // If all mirrors fail, throw; controller will handle gracefully.
  throw lastErr ?? new Error("Overpass unavailable")
}

function normalizeCafe(el: any) {
  const tags = el.tags ?? {}
  const center = el.center ?? {}
  const lat = el.lat ?? center.lat
  const lon = el.lon ?? center.lon
  return {
    title: tags.name || "Unnamed Café",
    description: formatDesc(tags),
    thumbnailUrl: undefined as string | undefined,
    externalId: String(el.id),
    location: { lat, lon },
    address:
      tags["addr:full"] ||
      [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]].filter(Boolean).join(" "),
    source: "openstreetmap",
  }
}

function formatDesc(tags: any) {
  const wifi = tags["internet_access"] ? `Wi-Fi: ${tags["internet_access"]}` : undefined
  const hours = tags["opening_hours"] ? `Hours: ${tags["opening_hours"]}` : undefined
  const takeaway = tags.takeaway ? `Takeaway: ${tags.takeaway}` : undefined
  return [wifi, takeaway, hours].filter(Boolean).join(" · ") || "Café"
}

function escapeRe(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") }
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

/* ------------------------- Yelp enrichment layer ------------------------- */

const yelpApiKey = process.env.YELP_API_KEY
const hasYelp = Boolean(yelpApiKey)

const yelp = axios.create({
  baseURL: "https://api.yelp.com/v3",
  headers: { Authorization: `Bearer ${yelpApiKey}` },
  timeout: 3500,
})

/**
 * Try to attach real photos from Yelp to a small number of items.
 * If there's no API key or Yelp fails, silently return the originals.
 */
async function maybeEnrichWithYelp(items: any[], ctx: { lat: number; lon: number; km: number }) {
  if (!hasYelp || items.length === 0) return items

  const radiusMeters = Math.min(Math.round(ctx.km * 1000), 40000) // Yelp max 40km
  const slice = items.slice(0, 10) // keep it snappy

  const enriched = await Promise.all(
    slice.map(async (item) => {
      const term = item.title
      try {
        const res = await yelp.get("/businesses/search", {
          params: {
            term,
            latitude: item.location?.lat ?? ctx.lat,
            longitude: item.location?.lon ?? ctx.lon,
            radius: radiusMeters,
            categories: "coffee,coffeeroasteries,cafes",
            sort_by: "best_match",
            limit: 1,
          },
        })
        const biz = res.data?.businesses?.[0]
        if (biz?.image_url) {
          item.thumbnailUrl = biz.image_url
        }
      } catch {
        // ignore — we don't want a failed image to cancel results
      }
      return item
    })
  )

  return enriched.concat(items.slice(enriched.length))
}
