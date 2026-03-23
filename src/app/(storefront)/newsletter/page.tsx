import { NewsletterForm } from '@/components/storefront/NewsletterForm'

export default function NewsletterPage() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-6 py-24">
            <div className="max-w-lg w-full text-center space-y-6">
                <div className="inline-flex items-center gap-2 bg-secondary px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-full text-muted-foreground">
                    Stay in the loop
                </div>
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
                    Join the Trident Community
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                    Get exclusive access to new arrivals, vendor spotlights, and style inspiration — delivered to your inbox.
                </p>
                <div className="pt-4">
                    <NewsletterForm />
                </div>
                <p className="text-xs text-muted-foreground/60">
                    No spam. Unsubscribe anytime.
                </p>
            </div>
        </div>
    )
}
