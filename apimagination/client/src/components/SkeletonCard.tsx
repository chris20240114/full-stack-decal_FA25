export default function SkeletonCard() {
  return (
    <li className="card p-4 animate-pulse">
      <div className="flex gap-4">
        <div className="h-20 w-20 rounded-lg bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 bg-gray-200 rounded" />
          <div className="h-3 w-2/3 bg-gray-200 rounded" />
          <div className="h-3 w-1/3 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="mt-4 h-9 w-24 bg-gray-200 rounded" />
    </li>
  )
}
