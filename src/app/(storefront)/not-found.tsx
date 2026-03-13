import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center animate-in fade-in">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
                <FileQuestion className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-4">Page Not Found</h2>
            <p className="text-muted-foreground mb-8 max-w-md text-lg">
                We couldn't find the page or resource you were looking for. It might have been removed or the link is incorrect.
            </p>
            <Link href="/">
                <Button size="lg" className="shadow-xl">
                    Return to Home
                </Button>
            </Link>
        </div>
    )
}
