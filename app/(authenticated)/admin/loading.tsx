export default function AdminLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

      {/* Page Title Skeleton */}
      <div className="h-8 w-40 bg-muted/40 rounded animate-pulse" />

      {/* Tab Bar Skeleton */}
      <div className="flex gap-2 border-b border-border pb-0">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-9 w-28 bg-muted/30 rounded-t-lg animate-pulse" />
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="glass-card rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-border bg-muted/10">
          <div className="flex-1 h-3 w-24 bg-muted/40 rounded animate-pulse" />
          <div className="w-24 h-3 bg-muted/30 rounded animate-pulse" />
          <div className="w-24 h-3 bg-muted/30 rounded animate-pulse" />
          <div className="w-20 h-3 bg-muted/30 rounded animate-pulse" />
          <div className="w-16 h-3 bg-muted/30 rounded animate-pulse" />
        </div>
        {/* Table Rows */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-b-0">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-muted/40 rounded-full animate-pulse flex-shrink-0" />
              <div className="space-y-1.5">
                <div className="h-4 w-36 bg-muted/40 rounded animate-pulse" />
                <div className="h-3 w-48 bg-muted/30 rounded animate-pulse" />
              </div>
            </div>
            <div className="w-24 h-4 bg-muted/30 rounded animate-pulse" />
            <div className="w-24 h-4 bg-muted/30 rounded animate-pulse" />
            <div className="w-20 h-6 bg-muted/30 rounded-full animate-pulse" />
            <div className="w-16 h-8 bg-muted/30 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>

    </div>
  )
}
