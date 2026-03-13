'use client'
import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function StorefrontError({
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
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center animate-in fade-in">
            <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Something went wrong!</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
                We apologize for the inconvenience. Please try loading the page again.
            </p>
            <Button onClick={() => reset()} size="lg" className="shadow-xl">
                Try again
            </Button>
        </div>
    )
}
