export default function DashboardLoading() {
    return (
        <div className="p-8 md:p-12 w-full animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="space-y-3">
                    <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                    <div className="h-4 w-48 bg-slate-100 dark:bg-slate-900 rounded-lg"></div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                    <div className="h-12 flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                        <div className="space-y-2 hidden sm:block">
                            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                            <div className="h-2 w-12 bg-slate-100 dark:bg-slate-900 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-32 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="space-y-3">
                                <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                <div className="h-8 w-16 bg-slate-100 dark:bg-slate-900 rounded"></div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts/Lists Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 h-80">
                    <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-8"></div>
                    <div className="h-64 w-full bg-slate-50 dark:bg-slate-900 rounded-xl"></div>
                </div>
                <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 h-80">
                    <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-8"></div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 shrink-0"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                                    <div className="h-2 w-2/3 bg-slate-100 dark:bg-slate-900 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
