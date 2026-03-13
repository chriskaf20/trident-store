import { Loader2 } from 'lucide-react'

export default function StorefrontLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-10 h-10 animate-spin text-primary/40" />
            <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">Loading experience...</p>
        </div>
    )
}
