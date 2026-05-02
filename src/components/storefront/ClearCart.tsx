'use client'

import { useCartStore } from '@/lib/store'
import { useEffect } from 'react'

export function ClearCart() {
    const clearCart = useCartStore((state) => state.clearCart)

    useEffect(() => {
        clearCart()
    }, [clearCart])

    return null
}
