export default function ProductLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Visuals Skeleton */}
        <div className="aspect-[1/1] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />

        {/* Info Skeleton */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
            <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
            <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
            <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
          </div>

          <div className="h-24 w-full bg-slate-50 dark:bg-slate-900 animate-pulse rounded-xl" />

          <div className="space-y-4">
            <div className="h-6 w-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
            <div className="h-32 w-full bg-slate-50 dark:bg-slate-900 animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
