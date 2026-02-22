export default function DashboardLoading() {
  return (
    <>
      {/* Hero Section Skeleton */}
      <div className="border-b border-white/10 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
            <div className="space-y-2">
              <div className="h-10 w-48 bg-muted/50 rounded-lg animate-pulse" />
              <div className="h-5 w-36 bg-muted/30 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-36 bg-muted/30 rounded-lg animate-pulse" />
              <div className="h-9 w-40 bg-muted/30 rounded-lg animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card border border-white/10 rounded-xl p-4">
                <div className="w-7 h-7 mb-2 bg-muted/40 rounded animate-pulse" />
                <div className="h-7 w-12 bg-muted/40 rounded mb-1 animate-pulse" />
                <div className="h-4 w-20 bg-muted/30 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Main Event Card Skeleton */}
        <div className="glass-card rounded-xl border-2 p-6 animate-pulse" style={{ borderColor: '#FFD700' }}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="h-5 w-24 bg-muted/40 rounded" />
              <div className="h-8 w-64 bg-muted/40 rounded" />
              <div className="h-4 w-80 bg-muted/30 rounded" />
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

        {/* My Competitions + Leaderboard Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          <div className="lg:col-span-3 space-y-2">
            <div className="h-6 w-40 bg-muted/40 rounded animate-pulse" />
            <div className="glass-card rounded-xl overflow-hidden">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0">
                  <div className="w-8 h-8 bg-muted/40 rounded-md animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-40 bg-muted/40 rounded animate-pulse" />
                    <div className="h-3 w-28 bg-muted/30 rounded animate-pulse" />
                  </div>
                  <div className="hidden sm:flex gap-6">
                    <div className="h-4 w-12 bg-muted/30 rounded animate-pulse" />
                    <div className="h-4 w-12 bg-muted/30 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-muted/30 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-2">
            <div className="h-6 w-32 bg-muted/40 rounded animate-pulse" />
            <div className="glass-card rounded-xl overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-b-0">
                  <div className="w-6 h-6 bg-muted/40 rounded-full animate-pulse" />
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
    </>
  )
}
