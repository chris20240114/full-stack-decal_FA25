import { useEffect, useMemo, useState } from "react"
import { searchExternal, saveItem } from "../lib/api"
import CafeCard from "../components/CafeCard"
import SkeletonCard from "../components/SkeletonCard"

export default function Search() {
  const [q, setQ] = useState("coffee")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounce user typing a bit
  const debouncedQ = useDebounce(q, 350)

  useEffect(() => {
    run(debouncedQ)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ])

  async function run(query: string) {
    if (!query?.trim()) { setResults([]); return }
    setLoading(true); setError(null)
    try {
      const data = await searchExternal(query)
      setResults(data.items ?? [])
    } catch (e: any) {
      setError(e?.response?.data?.message || "Search temporarily unavailable.")
      setResults([])
    } finally { setLoading(false) }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    run(q)
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">Find Cafés near Berkeley</h2>
        <form onSubmit={onSubmit} className="flex gap-2 w-full sm:w-auto">
          <input
            className="w-full sm:w-72 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="coffee, boba, espresso…"
          />
          <button className="btn-neutral" type="submit">Search</button>
        </form>
      </header>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {loading ? (
        <ul className="grid sm:grid-cols-2 gap-4 list-none p-0">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </ul>
      ) : results.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="grid sm:grid-cols-2 gap-4 list-none p-0">
          {results.map((r: any, i: number) => (
            <CafeCard
              key={r.externalId || i}
              item={r}
              onSave={() => saveItem(r).catch(() => alert("Save failed"))}
            />
          ))}
        </ul>
      )}
    </section>
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
