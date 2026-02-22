export default function CompetitionDetailLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

      {/* Header Skeleton */}
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-muted/30 rounded-lg animate-pulse flex-shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-3">
            <div className="h-7 w-56 bg-muted/40 rounded animate-pulse" />
            <div className="h-5 w-16 bg-muted/30 rounded-full animate-pulse" />
          </div>
          <div className="flex gap-3">
            <div className="h-4 w-24 bg-muted/30 rounded animate-pulse" />
            <div className="h-4 w-20 bg-muted/30 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-9 w-28 bg-muted/30 rounded-lg animate-pulse" />
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* Events Column (left) */}
        <div className="lg:col-span-3 space-y-4">

          {/* Sport Filter Tabs Skeleton */}
          <div className="flex gap-2 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 w-16 bg-muted/30 rounded-full animate-pulse flex-shrink-0" />
            ))}
          </div>

          {/* Event Card Skeletons */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-12 bg-muted/40 rounded" />
                    <div className="h-4 w-32 bg-muted/30 rounded" />
                  </div>
                  <div className="h-5 w-64 bg-muted/40 rounded" />
                </div>
                <div className="h-6 w-20 bg-muted/30 rounded-full flex-shrink-0" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1 h-10 bg-muted/30 rounded-lg" />
                <div className="flex-1 h-10 bg-muted/30 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Leaderboard Column (right) */}
        <div className="lg:col-span-2 lg:sticky lg:top-6 space-y-2">
          <div className="h-6 w-32 bg-muted/40 rounded animate-pulse" />
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-2 border-b border-border">
              <div className="w-6 h-3 bg-muted/30 rounded animate-pulse" />
              <div className="flex-1 h-3 bg-muted/30 rounded animate-pulse" />
              <div className="w-12 h-3 bg-muted/30 rounded animate-pulse" />
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-b-0">
                <div className="w-6 h-6 bg-muted/40 rounded-full animate-pulse flex-shrink-0" />
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-6 h-6 bg-muted/40 rounded-full animate-pulse" />
                  <div className="h-4 w-28 bg-muted/30 rounded animate-pulse" />
                </div>
                <div className="h-4 w-8 bg-muted/30 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
