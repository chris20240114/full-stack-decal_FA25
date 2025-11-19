import { useEffect, useMemo, useState } from "react"
import { searchExternal, saveItem, searchItems } from "../lib/api"
import CafeCard from "../components/CafeCard"
import SkeletonCard from "../components/SkeletonCard" 
import type { Item } from "../lib/Item"

export default function SearchPage() {
  const [query, setQuery] = useState("coffee")
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runSearch = async (q: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await searchItems(q)
      console.log("SearchPage items:", res) // ✅ debug
      setItems(res)
    } catch (e) {
      console.error(e)
      setError("Failed to fetch cafés.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runSearch(query)
  }, [])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    runSearch(query)
  }

  return (
    <div className="container-safe py-8">
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <h1 className="text-2xl font-semibold text-gray-900">
          Find Cafés near Berkeley
        </h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Search for coffee, boba, tea..."
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </div>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {items.map((item) => (
          <CafeCard
            key={item.externalId ?? item.title}
            item={item}
          />
        ))}
      </div>
    </div>
  )
}
function EmptyState() {
  return (
    <div className="card p-8 text-center">
      <p className="text-gray-600">
        No results yet. Try <span className="font-medium">“cafe”</span>,{" "}
        <span className="font-medium">“boba”</span>, or{" "}
        <span className="font-medium">“espresso”</span>.
      </p>
    </div>
  )
}

function useDebounce<T>(value: T, ms: number) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}
