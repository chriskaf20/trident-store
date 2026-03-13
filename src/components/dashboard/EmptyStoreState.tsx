'use client'

import { useState, useTransition } from 'react'
import { createStoreFromApplication } from '@/app/(vendor)/dashboard/actions'

export function EmptyStoreState() {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const handleSetup = async () => {
        setError(null)
        startTransition(async () => {
            const result = await createStoreFromApplication()
            if (result?.error) {
                setError(result.error)
            }
        })
    }

    return (
        <div className="flex items-center justify-center min-h-[50vh] p-8">
            <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-950 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <span className="material-symbols-outlined !text-4xl text-amber-600 ">store</span>
                </div>
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter mb-3">Complete Store Setup</h1>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        You're approved as a vendor, but your store hasn't been created yet. Click below to finish setting it up instantly.
                    </p>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold">
                        {error}
                    </div>
                )}

                <button 
                    onClick={handleSetup}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 font-bold rounded-xl shadow-lg shadow-primary/25 hover:opacity-90 transition-all enabled:hover:scale-[1.02] disabled:opacity-50 uppercase tracking-widest text-sm mt-4 w-full justify-center"
                >
                    {isPending ? (
                        <>
                            <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                            Setting up...
                        </>
                    ) : (
                        <>
                            Complete Setup Now
                            <span className="material-symbols-outlined !text-[20px]">arrow_forward</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
