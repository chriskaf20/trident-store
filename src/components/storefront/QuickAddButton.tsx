'use client'

import { ShoppingCart, Check } from 'lucide-react'
import { useState } from 'react'
import { useCartStore } from '@/lib/store'

interface QuickAddButtonProps {
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

export function QuickAddButton({ product }: QuickAddButtonProps) {
    const addItem = useCartStore((state) => state.addItem)
    const [added, setAdded] = useState(false)

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (product.stock === 0 || added) return
        addItem({ ...product, quantity: 1 })
        setAdded(true)
        setTimeout(() => setAdded(false), 2000)
    }

    return (
        <button
            onClick={handleClick}
            disabled={product.stock === 0}
            title={product.stock === 0 ? 'Out of stock' : 'Quick add to cart'}
            className={[
                'absolute bottom-2 right-2 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all duration-200',
                added
                    ? 'bg-green-600 text-white scale-110'
                    : product.stock === 0
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-foreground text-background hover:scale-110 active:scale-95',
            ].join(' ')}
        >
            {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
        </button>
    )
}
