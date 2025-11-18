import { useEffect, useState } from "react"
import { listSaved, deleteItem } from "../lib/api"
import CafeCard from "../components/CafeCard"

export default function Saved() {
  const [items, setItems] = useState<any[]>([])
  const load = () => listSaved().then(setItems)

  useEffect(() => { load() }, [])

  return (
    <section className="space-y-5">
      <header className="flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Saved Cafés</h2>
        <p className="text-sm text-gray-500">{items.length} saved</p>
      </header>

      {items.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-600">No saved cafés yet. Save some from the Search page!</p>
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-4 list-none p-0">
          {items.map((it) => (
            <CafeCard
              key={it._id}
              item={it}
              onSave={() => deleteItem(it._id).then(load)}
              actionLabel="Delete"
            />
          ))}
        </ul>
      )}
    </section>
  )
}
