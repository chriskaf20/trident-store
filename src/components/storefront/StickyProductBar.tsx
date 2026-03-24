'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/lib/store'

interface StickyProductBarProps {
    product: {
        id: string
        name: string
        price: number
        image: string
        vendorId: string
        vendorName: string
        stock: number
    }
    /** The DOM id of the element to observe — when it leaves view the bar appears */
    triggerElementId: string
}

export function StickyProductBar({ product, triggerElementId }: StickyProductBarProps) {
    const [visible, setVisible] = useState(false)
    const addItem = useCartStore((state) => state.addItem)
    const [added, setAdded] = useState(false)

    useEffect(() => {
        const trigger = document.getElementById(triggerElementId)
        if (!trigger) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                // show bar when trigger is OUT of view
                setVisible(!entry.isIntersecting)
            },
            { threshold: 0 }
        )
        observer.observe(trigger)
        return () => observer.disconnect()
    }, [triggerElementId])

    const handleAddToCart = () => {
        addItem({ ...product, quantity: 1 })
        setAdded(true)
        setTimeout(() => setAdded(false), 2000)
    }

    return (
        <div
            className={[
                'fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm shadow-2xl transition-transform duration-300',
                visible ? 'translate-y-0' : 'translate-y-full',
            ].join(' ')}
        >
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-3 flex items-center gap-4">
                {/* Thumbnail */}
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
                    {product.image && (
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                        />
                    )}
                </div>

                {/* Name + Price */}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                        {Number(product.price).toLocaleString('en-US')} TL
                    </p>
                </div>

                {/* Add to Cart */}
                <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0 || added}
                    className={[
                        'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shrink-0',
                        added
                            ? 'bg-green-600 text-white'
                            : 'bg-foreground text-background hover:opacity-90 active:scale-95',
                        product.stock === 0 ? 'opacity-50 cursor-not-allowed' : '',
                    ].join(' ')}
                >
                    <ShoppingCart className="w-4 h-4" />
                    {added ? 'Added!' : 'Add to Cart'}
                </button>
            </div>
        </div>
    )
}
