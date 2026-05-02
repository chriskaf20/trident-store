'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { confirmReceipt } from '../actions'
import { showToast } from '@/components/ui/Toast'

interface ConfirmReceiptButtonProps {
    orderId: string
    status: string
}

export function ConfirmReceiptButton({ orderId, status }: ConfirmReceiptButtonProps) {
    const [isLoading, setIsLoading] = useState(false)

    if (status === 'delivered') return null

    const handleConfirm = async () => {
        try {
            setIsLoading(true)
            await confirmReceipt(orderId)
            showToast('Order marked as received!', 'success')
        } catch (error: any) {
            showToast(error.message || 'Failed to confirm receipt', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button 
            size="sm" 
            variant="outline" 
            onClick={handleConfirm} 
            disabled={isLoading}
            className="mt-4 w-full sm:w-auto"
        >
            {isLoading ? 'Confirming...' : 'Confirm Receipt'}
        </Button>
    )
}
