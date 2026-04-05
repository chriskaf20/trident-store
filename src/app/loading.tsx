export default function GlobalLoading() {
    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 rounded-full border-4 border-foreground/10 border-t-foreground animate-spin"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Loading...</p>
            </div>
        </div>
    )
}
