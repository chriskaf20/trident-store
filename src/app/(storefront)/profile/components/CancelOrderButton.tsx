'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { cancelOrder } from '../actions'
import { showToast } from '@/components/ui/Toast'

interface CancelOrderButtonProps {
    orderId: string
    status: string
}

export function CancelOrderButton({ orderId, status }: CancelOrderButtonProps) {
    const [isLoading, setIsLoading] = useState(false)

    // Only show for pending orders
    if (status !== 'pending') return null

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) return
        try {
            setIsLoading(true)
            await cancelOrder(orderId)
            showToast('Order cancelled successfully.', 'success')
        } catch (error: any) {
            showToast(error.message || 'Failed to cancel order', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="mt-4 w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
        >
            {isLoading ? 'Cancelling...' : 'Cancel Order'}
        </Button>
    )
}
