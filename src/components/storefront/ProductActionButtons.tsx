'use client'

import { useState } from 'react'
import { Plus, Minus, ShoppingCart, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCartStore } from '@/lib/store'
import { showToast } from '@/components/ui/Toast'

interface Product {
    id: string
    name: string
    price: number
    image: string
    vendorId: string
    vendorName: string
    stock: number
}

interface ProductActionButtonsProps {
    product: Product
    selectedSize?: string | null
    selectedColor?: string | null
    hasSizes?: boolean
}

export function ProductActionButtons({
    product,
    selectedSize,
    selectedColor,
    hasSizes = false,
}: ProductActionButtonsProps) {
    const [quantity, setQuantity] = useState(1)
    const addItem = useCartStore((state) => state.addItem)

    const validate = (): boolean => {
        if (hasSizes && !selectedSize) {
            showToast('Please select a size first', 'error')
            return false
        }
        return true
    }

    const handleAddToCart = () => {
        if (!validate()) return
        addItem({ ...product, quantity })
        showToast(`${product.name} added to cart!`, 'cart')
    }

    const handleBuyNow = () => {
        if (!validate()) return
        addItem({ ...product, quantity })
        // Open cart drawer by dispatching event
        window.dispatchEvent(new CustomEvent('trident:open-cart'))
    }

    const isOutOfStock = product.stock === 0

    return (
        <div className="flex flex-col gap-3 mb-6">
            {/* Quantity selector */}
            <div className="flex items-center gap-3">
                <div className="flex items-center border border-border rounded-xl overflow-hidden bg-secondary/20">
                    <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1 || isOutOfStock}
                        className="px-4 py-3 hover:bg-secondary transition-colors disabled:opacity-30"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-5 py-3 font-bold text-sm min-w-[3rem] text-center">{quantity}</span>
                    <button
                        type="button"
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        disabled={quantity >= product.stock || isOutOfStock}
                        className="px-4 py-3 hover:bg-secondary transition-colors disabled:opacity-30"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <span className="text-xs text-muted-foreground">
                    {isOutOfStock ? 'Out of stock' : `${product.stock} available`}
                </span>
            </div>

            {/* CTA buttons */}
            <div className="flex gap-3">
                <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 text-sm font-bold border-2 gap-2"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                </Button>
                <Button
                    size="lg"
                    className="flex-1 text-sm font-bold gap-2 shadow-xl"
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                >
                    <Zap className="w-4 h-4" />
                    Buy Now
                </Button>
            </div>
        </div>
    )
}
