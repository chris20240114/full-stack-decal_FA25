import type { Item } from "../lib/Item.ts"

type CafeCardProps = {
  item: Item
  onSave?: () => void
  onRemove?: () => void
  isSaved?: boolean
}

export default function CafeCard({
  item,
  onSave,
  onRemove,
  isSaved,
}: CafeCardProps) {
  // Unsplash backup if backend didn't find a Yelp photo
  const fallback = `https://source.unsplash.com/160x160/?coffee,cafe&sig=${encodeURIComponent(
    item.title
  )}`

  const src = item.thumbnailUrl || fallback

  const handleClick = () => {
    if (isSaved && onRemove) onRemove()
    else if (!isSaved && onSave) onSave()
  }

  return (
    <div className="card flex gap-4 items-start">
      {/* IMAGE */}
      <div className="shrink-0">
        <img
          src={src}
          alt={item.title}
          className="h-24 w-24 rounded-lg object-cover bg-gray-100 border border-gray-200"
        />
      </div>

      {/* TEXT */}
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{item.title}</h3>

        {item.address && (
          <p className="text-sm text-gray-600">{item.address}</p>
        )}

        {item.description && (
          <p className="mt-1 text-xs text-gray-500">{item.description}</p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="badge text-xs">openstreetmap</span>
          {(onSave || onRemove) && (
            <button
              className={`btn ${
                isSaved ? "btn-danger" : "btn-primary"
              } text-xs px-3 py-1`}
              onClick={handleClick}
            >
              {isSaved ? "Remove" : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}