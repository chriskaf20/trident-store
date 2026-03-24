'use client'

import { useState } from 'react'
import { SizeSelector } from './SizeSelector'
import { ColorSelector } from './ColorSelector'
import { ProductActionButtons } from './ProductActionButtons'

interface Product {
    id: string
    name: string
    price: number
    image: string
    vendorId: string
    vendorName: string
    stock: number
}

interface ProductVariantSelectorProps {
    product: Product
    sizes: string[]
    colors: { name: string; hex: string }[]
}

/**
 * Client wrapper that tracks size/color state and passes them to
 * both the variant selectors and the action buttons (Add to Cart / Buy Now).
 * This must be a client component so we can useState — the parent page.tsx stays a server component.
 */
export function ProductVariantSelector({ product, sizes, colors }: ProductVariantSelectorProps) {
    const [selectedSize, setSelectedSize] = useState<string | null>(null)
    const [selectedColor, setSelectedColor] = useState<string | null>(null)

    return (
        <div id="product-actions-trigger">
            {/* Color selector */}
            <ColorSelector
                colors={colors}
                selectedColor={selectedColor}
                onSelect={setSelectedColor}
            />

            {/* Size selector */}
            <SizeSelector
                sizes={sizes}
                selectedSize={selectedSize}
                onSelect={setSelectedSize}
                outOfStock={product.stock === 0}
            />

            {/* Add to Cart + Buy Now */}
            <ProductActionButtons
                product={product}
                selectedSize={selectedSize}
                selectedColor={selectedColor}
                hasSizes={sizes.length > 0}
            />
        </div>
    )
}
