export default function ProductsLoading() {
  return (
    <div className="flex-1 w-full bg-background">
      <div className="bg-slate-50 dark:bg-slate-900 border-b border-border/40 py-12 md:py-20 text-center px-4">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 animate-pulse mx-auto mb-4 rounded-lg" />
        <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800 animate-pulse mx-auto rounded-lg" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Sidebar Skeleton */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
            <div className="space-y-4">
              <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-4 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                ))}
              </div>
            </div>
          </aside>

          {/* Product Grid Skeleton */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-4 space-y-4">
                  <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
                  <div className="space-y-2">
                    <div className="h-3 w-1/3 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                    <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
