'use client'
import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function VendorError({
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
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-secondary/20 rounded-2xl border border-destructive/10 text-center p-6 animate-in fade-in">
            <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-2">Unexpected Error</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-md">
                We encountered an issue processing your dashboard data.
            </p>
            <Button onClick={() => reset()} variant="outline" className="shadow-sm">
                Refresh View
            </Button>
        </div>
    )
}
