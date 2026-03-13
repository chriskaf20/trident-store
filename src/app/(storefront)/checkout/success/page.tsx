import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { CheckCircle2 } from 'lucide-react'

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ order_id?: string }> }) {
    const resolvedSearchParams = await searchParams;
    return (
        <div className="min-h-[70vh] flex items-center justify-center px-6">
            <div className="max-w-md w-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex justify-center mb-8">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold tracking-tight">Order Confirmed!</h1>

                <p className="text-muted-foreground text-lg leading-relaxed">
                    Thank you for shopping with Trident Store. Your offline order has been securely placed.
                </p>

                {resolvedSearchParams.order_id && (
                    <div className="bg-secondary p-4 rounded-xl border border-border/50 inline-block">
                        <span className="text-sm text-muted-foreground mr-2">Order ID:</span>
                        <span className="font-mono font-bold tracking-wider">{resolvedSearchParams.order_id}</span>
                    </div>
                )}

                <div className="pt-8">
                    <Link href="/">
                        <Button size="lg" className="w-full">
                            Continue Shopping
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
