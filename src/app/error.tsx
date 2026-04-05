'use client'

import { useEffect } from 'react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">We're sorry, but an unexpected error occurred. Please try again.</p>
            <button
                onClick={() => reset()}
                className="px-6 py-2 bg-foreground text-background rounded-full font-medium shadow-sm hover:opacity-90"
            >
                Try again
            </button>
        </div>
    )
}
