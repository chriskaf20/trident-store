'use client'

import { useState } from 'react'
import { validateDiscountCode } from '@/app/(storefront)/cart/actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AlertCircle, Tag, X } from 'lucide-react'
import { useCartStore, DiscountInfo } from '@/lib/store'

export function PromoCodeForm() {
    const { cartTotal, applyDiscount, removeDiscount, discount } = useCartStore()
    const [code, setCode] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleApply = async () => {
        if (!code.trim()) return

        setIsLoading(true)
        setError(null)

        try {
            const currentTotal = cartTotal()
            const result = await validateDiscountCode(code.trim(), currentTotal)

            if (result.error) {
                setError(result.error)
            } else if (result.success && result.discount) {
                applyDiscount(result.discount as DiscountInfo)
                setCode('')
            }
        } catch (err) {
            setError('An error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    if (discount) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-700">
                    <Tag className="w-4 h-4" />
                    <span className="font-semibold text-sm">Code '{discount.code}' applied</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-bold text-green-700">-{discount.savings.toLocaleString()} TL</span>
                    <button
                        onClick={removeDiscount}
                        className="p-1 hover:bg-green-100 rounded-full transition-colors text-green-700"
                        title="Remove discount"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
                <Tag className="w-4 h-4" /> Promo Code
            </h3>
            <div className="flex gap-2">
                <Input
                    placeholder="Enter code"
                    value={code}
                    onChange={(e) => {
                        setCode(e.target.value)
                        setError(null)
                    }}
                    className="flex-1 bg-white border-border/60"
                />
                <Button
                    onClick={handleApply}
                    disabled={!code.trim() || isLoading}
                    className="font-semibold px-6"
                >
                    Apply
                </Button>
            </div>
            {error && (
                <div className="text-destructive text-sm flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    )
}
