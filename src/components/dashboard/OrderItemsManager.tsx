'use client'

import { useState } from 'react'
import { updateOrderItemStatus } from '@/app/(vendor)/dashboard/order-actions'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface OrderItem {
    id: string
    product_name: string
    product_image?: string
    quantity: number
    price: number
    status: string
    tracking_number?: string
    shipped_at?: string
}

interface OrderItemsManagerProps {
    orderId: string
    items: OrderItem[]
    customerName: string
    customerEmail: string
}

export function OrderItemsManager({
    orderId,
    items,
    customerName,
    customerEmail
}: OrderItemsManagerProps) {
    const [loading, setLoading] = useState<string | null>(null)
    const [trackingNumber, setTrackingNumber] = useState<Record<string, string>>({})
    const [updatedItems, setUpdatedItems] = useState<Record<string, string>>({})

    const statusFlow: Record<string, string[]> = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['processing', 'cancelled'],
        processing: ['shipped', 'cancelled'],
        shipped: ['delivered'],
        delivered: [],
        cancelled: []
    }

    const statusColors: Record<string, { bg: string; text: string }> = {
        pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400' },
        confirmed: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
        processing: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' },
        shipped: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400' },
        delivered: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400' },
        cancelled: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
    }

    async function handleStatusChange(
        itemId: string,
        newStatus: string,
        tracking?: string
    ) {
        setLoading(itemId)
        try {
            await updateOrderItemStatus(
                orderId,
                itemId,
                newStatus as any,
                tracking
            )
            setUpdatedItems(prev => ({ ...prev, [itemId]: newStatus }))
            setTrackingNumber(prev => ({ ...prev, [itemId]: '' }))
        } catch (error) {
            console.error('Failed to update status:', error)
            alert('Failed to update order status')
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="space-y-4">
            {items.map((item) => {
                const currentStatus = updatedItems[item.id] || item.status
                const availableNextStatuses = statusFlow[currentStatus] || []
                
                return (
                    <Card key={item.id} className="border-slate-200 dark:border-slate-800">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Product</p>
                                    <p className="font-semibold text-slate-900 dark:text-white">{item.product_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Quantity × Price</p>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {item.quantity} × ₹{item.price.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Total</p>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        ₹{(item.quantity * item.price).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Status</p>
                                    <Badge className={`${statusColors[currentStatus]?.bg || 'bg-slate-100'} ${statusColors[currentStatus]?.text || 'text-slate-600'} capitalize`}>
                                        {currentStatus}
                                    </Badge>
                                </div>
                            </div>

                            {/* Tracking Info */}
                            {(item.tracking_number || trackingNumber[item.id]) && (
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg mb-4">
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Tracking Number</p>
                                    <p className="font-mono text-sm text-slate-900 dark:text-white">
                                        {trackingNumber[item.id] || item.tracking_number}
                                    </p>
                                </div>
                            )}

                            {/* Status Actions */}
                            <div className="space-y-3">
                                {availableNextStatuses.length > 0 && (
                                    <>
                                        {currentStatus !== 'shipped' && trackingNumber[item.id] === undefined && (
                                            <div className="flex items-end gap-2">
                                                <div className="flex-1">
                                                    <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">
                                                        Tracking Number (Optional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Enter tracking number..."
                                                        value={trackingNumber[item.id] || ''}
                                                        onChange={(e) => setTrackingNumber(prev => ({
                                                            ...prev,
                                                            [item.id]: e.target.value
                                                        }))}
                                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {availableNextStatuses.map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => handleStatusChange(
                                                        item.id,
                                                        status,
                                                        trackingNumber[item.id]
                                                    )}
                                                    disabled={loading === item.id}
                                                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors capitalize ${
                                                        status === 'cancelled'
                                                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20'
                                                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20'
                                                    } ${loading === item.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {loading === item.id ? 'Updating...' : `Mark ${status}`}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {availableNextStatuses.length === 0 && currentStatus === 'delivered' && (
                                    <div className="p-3 bg-green-500/10 rounded-lg text-center">
                                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                            ✓ Order delivered - no further actions
                                        </p>
                                    </div>
                                )}

                                {availableNextStatuses.length === 0 && currentStatus === 'cancelled' && (
                                    <div className="p-3 bg-red-500/10 rounded-lg text-center">
                                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                                            Order cancelled - no further actions
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
