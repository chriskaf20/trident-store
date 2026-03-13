import { Loader2 } from 'lucide-react'

export default function VendorLoading() {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
            <p className="mt-3 text-xs text-muted-foreground font-medium uppercase tracking-widest animate-pulse">Loading Workspace</p>
        </div>
    )
}
