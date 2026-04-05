import Link from 'next/link'

export default function GlobalNotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <h1 className="text-7xl font-black mb-4 tracking-tighter text-slate-200 dark:text-slate-800">404</h1>
            <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
            <p className="text-muted-foreground mb-8">The page you are looking for doesn't exist or has been moved.</p>
            <Link
                href="/"
                className="px-8 py-4 bg-foreground text-background rounded-full font-bold shadow-xl hover:scale-105 transition-transform"
            >
                Return Home
            </Link>
        </div>
    )
}
