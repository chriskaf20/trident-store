'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { updateOrderItemStatus } from '../../order-actions'
import { showToast } from '@/components/ui/Toast'
import { 
    CheckCircle2, 
    Truck, 
    PackageCheck, 
    XCircle,
    ChevronDown
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'

interface OrderItemActionsProps {
    orderId: string
    itemId: string
    currentStatus: string
}

export function OrderItemActions({ orderId, itemId, currentStatus }: OrderItemActionsProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleStatusUpdate = async (newStatus: any) => {
        try {
            setIsLoading(true)
            await updateOrderItemStatus(orderId, itemId, newStatus)
            showToast(`Status updated to ${newStatus}`, 'success')
        } catch (error: any) {
            showToast(error.message || 'Failed to update status', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const statusConfig: Record<string, { label: string, icon: any, color: string }> = {
        pending: { label: 'Pending', icon: PackageCheck, color: 'text-yellow-600' },
        confirmed: { label: 'Confirmed', icon: CheckCircle2, color: 'text-blue-600' },
        processing: { label: 'Processing', icon: PackageCheck, color: 'text-purple-600' },
        shipped: { label: 'Shipped', icon: Truck, color: 'text-indigo-600' },
        delivered: { label: 'Delivered', icon: CheckCircle2, color: 'text-green-600' },
        cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-600' },
    }

    const config = statusConfig[currentStatus] || statusConfig.pending

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isLoading} className="gap-2">
                    <config.icon className={`w-4 h-4 ${config.color}`} />
                    {isLoading ? 'Updating...' : config.label}
                    <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuItem onClick={() => handleStatusUpdate('confirmed')}>
                    Confirm Order
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusUpdate('processing')}>
                    Start Processing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusUpdate('shipped')}>
                    Mark as Shipped
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusUpdate('delivered')}>
                    Mark as Delivered
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusUpdate('cancelled')} className="text-red-600">
                    Cancel Item
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
