type Props = {
  item: any
  onSave?: () => void
  actionLabel?: string
}
export default function CafeCard({ item, onSave, actionLabel = "Save" }: Props) {
  return (
    <li className="card p-4 transition hover:shadow-md">
      <div className="flex gap-4">
            {item.thumbnailUrl ? (
            <img
                className="h-20 w-20 rounded-lg object-cover"
                src={item.thumbnailUrl}
                alt=""
            />
            ) : (
            <div className="h-20 w-20 rounded-lg bg-gray-200" />
            )}
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
          {item.address && (
            <p className="text-sm text-gray-600 truncate">{item.address}</p>
          )}
          {item.description && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-2">
              {item.description}
            </p>
          )}
          {item.source && (
            <span className="badge mt-2">{item.source}</span>
          )}
        </div>
      </div>
      {onSave && (
        <div className="mt-4">
          <button className="btn-primary" onClick={onSave}>{actionLabel}</button>
        </div>
      )}
    </li>
  )
}
