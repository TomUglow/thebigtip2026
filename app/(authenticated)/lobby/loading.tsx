export default function LobbyLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

      {/* Main Event Card Skeleton */}
      <div className="glass-card rounded-xl border-2 p-6 animate-pulse" style={{ borderColor: '#FFD700' }}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="h-5 w-24 bg-muted/40 rounded" />
            <div className="h-8 w-64 bg-muted/40 rounded" />
            <div className="h-4 w-72 bg-muted/30 rounded" />
            <div className="flex gap-4">
              <div className="h-4 w-24 bg-muted/30 rounded" />
              <div className="h-4 w-20 bg-muted/30 rounded" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-12 h-12 bg-muted/40 rounded-lg" />
              ))}
            </div>
            <div className="h-10 w-32 bg-muted/40 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Search + Filter Bar Skeleton */}
      <div className="flex gap-3">
        <div className="flex-1 h-10 bg-muted/30 rounded-lg animate-pulse" />
        <div className="h-10 w-28 bg-muted/30 rounded-lg animate-pulse" />
      </div>

      {/* Competition List Skeleton */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="hidden sm:flex items-center gap-4 px-4 py-2 border-b border-border">
          <div className="flex-1 h-3 w-24 bg-muted/30 rounded animate-pulse" />
          <div className="w-16 h-3 bg-muted/30 rounded animate-pulse" />
          <div className="w-16 h-3 bg-muted/30 rounded animate-pulse" />
          <div className="w-16 h-3 bg-muted/30 rounded animate-pulse" />
          <div className="w-20 h-3 bg-muted/30 rounded animate-pulse" />
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0">
            <div className="w-8 h-8 bg-muted/40 rounded-md animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-48 bg-muted/40 rounded animate-pulse" />
              <div className="h-3 w-32 bg-muted/30 rounded animate-pulse" />
            </div>
            <div className="hidden sm:flex items-center gap-6">
              <div className="h-4 w-10 bg-muted/30 rounded animate-pulse" />
              <div className="h-4 w-10 bg-muted/30 rounded animate-pulse" />
              <div className="h-5 w-14 bg-muted/30 rounded-full animate-pulse" />
              <div className="h-4 w-16 bg-muted/30 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
