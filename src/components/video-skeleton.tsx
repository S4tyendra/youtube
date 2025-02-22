export function VideoSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="space-y-2 p-2">
          <div className="aspect-video bg-accent animate-pulse rounded-lg" />
          <div className="h-4 w-3/4 bg-accent animate-pulse rounded" />
          <div className="h-3 w-1/2 bg-accent animate-pulse rounded" />
        </div>
      ))}
    </div>
  )
}