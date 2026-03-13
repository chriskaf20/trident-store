'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCartStore } from '@/lib/store'

interface ProductActionButtonsProps {
    product: {
        id: string
        name: string
        price: number
        image: string
        vendorId: string
        vendorName: string
        stock: number
    }
}

export function ProductActionButtons({ product }: ProductActionButtonsProps) {
    const [quantity, setQuantity] = useState(1)
    const addItem = useCartStore((state) => state.addItem)

    const handleAddToCart = () => {
        addItem({ ...product, quantity })
        // In a real app, optionally trigger a toast
        alert('Added to cart!')
    }

    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex items-center justify-between border border-border rounded-lg p-1 w-full sm:w-32 bg-secondary/20">
                <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-secondary rounded-md transition-colors"
                    disabled={quantity <= 1}
                >
                    <Minus className="w-4 h-4" />
                </button>
                <span className="font-semibold">{quantity}</span>
                <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-2 hover:bg-secondary rounded-md transition-colors"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <Button
                size="lg"
                className="flex-1 text-base font-semibold shadow-xl"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
            >
                Add to Cart
            </Button>
        </div>
    )
}
