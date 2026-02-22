export default function AccountLoading() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">

      {/* Back link + Title Skeleton */}
      <div className="space-y-1">
        <div className="h-4 w-24 bg-muted/30 rounded animate-pulse" />
        <div className="h-8 w-36 bg-muted/40 rounded animate-pulse mt-2" />
      </div>

      {/* Profile Card Skeleton */}
      <div className="glass-card rounded-xl p-6 space-y-6">
        {/* Avatar + Name Row */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-muted/40 rounded-full animate-pulse flex-shrink-0" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-muted/40 rounded animate-pulse" />
            <div className="h-4 w-48 bg-muted/30 rounded animate-pulse" />
          </div>
        </div>

        {/* Profile Fields */}
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
              <div className="space-y-1">
                <div className="h-3 w-16 bg-muted/30 rounded animate-pulse" />
                <div className="h-4 w-40 bg-muted/40 rounded animate-pulse" />
              </div>
              <div className="h-8 w-16 bg-muted/30 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Password Section Skeleton */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="h-5 w-32 bg-muted/40 rounded animate-pulse" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 w-full bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-10 w-32 bg-muted/40 rounded-lg animate-pulse" />
      </div>

      {/* Favourite Teams Section Skeleton */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="h-5 w-36 bg-muted/40 rounded animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 w-40 bg-muted/30 rounded animate-pulse" />
            <div className="h-7 w-7 bg-muted/30 rounded animate-pulse" />
          </div>
        ))}
      </div>

    </div>
  )
}
