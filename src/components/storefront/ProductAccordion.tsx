'use client'

import { useState } from 'react'
import { ChevronDown, Package, Truck, Store, Shirt, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ProductAccordionProps {
    description: string
    vendorName: string
    vendorId: string
}

interface PanelProps {
    icon: React.ReactNode
    title: string
    children: React.ReactNode
    defaultOpen?: boolean
}

function Panel({ icon, title, children, defaultOpen = false }: PanelProps) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div className="border-b border-border/50 last:border-0">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full py-4 text-left group"
            >
                <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{icon}</span>
                    <span className="font-semibold text-sm">{title}</span>
                </div>
                <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
            </button>
            <div className={cn('overflow-hidden transition-all duration-300', open ? 'max-h-[500px] pb-4' : 'max-h-0')}>
                {children}
            </div>
        </div>
    )
}

export function ProductAccordion({ description, vendorName, vendorId }: ProductAccordionProps) {
    return (
        <div className="rounded-xl border border-border/50 bg-secondary/10 px-4 mb-6">

            <Panel icon={<Package className="w-4 h-4" />} title="Product Details" defaultOpen>
                <p className="text-sm text-muted-foreground leading-relaxed pl-7">
                    {description || 'No description provided.'}
                </p>
            </Panel>

            <Panel icon={<Truck className="w-4 h-4" />} title="Shipping & Returns">
                <div className="pl-7 space-y-2 text-sm text-muted-foreground">
                    <p>🚚 <strong className="text-foreground">Cash on Delivery</strong> — Pay when your order arrives.</p>
                    <p>🏪 <strong className="text-foreground">In-Store Pickup</strong> — Pick up directly from the vendor.</p>
                    <p>↩️ <strong className="text-foreground">14-Day Returns</strong> — Unused items in original condition.</p>
                </div>
            </Panel>

            <Panel icon={<Store className="w-4 h-4" />} title="About the Vendor">
                <div className="pl-7 space-y-2 text-sm">
                    <p className="text-muted-foreground">Sold by a vetted local creator on Trident Store.</p>
                    <Link href={`/stores/${vendorId}`} className="inline-flex items-center gap-1 font-medium hover:underline">
                        Visit {vendorName}&apos;s Store →
                    </Link>
                </div>
            </Panel>

        </div>
    )
}
