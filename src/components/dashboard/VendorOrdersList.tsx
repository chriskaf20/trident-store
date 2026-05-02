'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { Inbox, ChevronRight } from 'lucide-react'

interface OrderItem {
    id: string
    product_name: string
    quantity: number
    price: number
    status: string
    tracking_number?: string
}

interface Order {
    id: string
    created_at: string
    total_amount: number
    status: string
    delivery_method: string
    order_items: OrderItem[]
    profiles: {
        full_name: string
        email: string
    }
}

interface VendorOrdersListProps {
    orders: Order[]
    storeId: string
}

export function VendorOrdersList({ orders, storeId }: VendorOrdersListProps) {
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

    const statusColors: Record<string, { bg: string; text: string }> = {
        pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400' },
        confirmed: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
        processing: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' },
        shipped: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400' },
        delivered: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400' },
        cancelled: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
    }

    if (!orders || orders.length === 0) {
        return (
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardContent className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
                            <Inbox className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="font-semibold text-slate-700 dark:text-slate-300">No orders yet</h3>
                        <p className="text-sm text-slate-500">Your orders will appear here once customers place them</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                <th className="p-5 font-medium">Order ID</th>
                                <th className="p-5 font-medium">Customer</th>
                                <th className="p-5 font-medium">Items</th>
                                <th className="p-5 font-medium">Total</th>
                                <th className="p-5 font-medium">Status</th>
                                <th className="p-5 font-medium">Date</th>
                                <th className="p-5 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {orders.map((order) => (
                                <tr
                                    key={order.id}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                                >
                                    <td className="p-5">
                                        <code className="text-xs font-mono font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                            {order.id.slice(0, 8)}...
                                        </code>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex flex-col gap-1">
                                            <p className="font-semibold text-slate-900 dark:text-white text-sm">
                                                {order.profiles?.full_name || 'Customer'}
                                            </p>
                                            <p className="text-xs text-slate-500">{order.profiles?.email}</p>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            {order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}
                                        </p>
                                    </td>
                                    <td className="p-5">
                                        <p className="font-semibold text-slate-900 dark:text-white">
                                            ₹{(order.total_amount || 0).toLocaleString()}
                                        </p>
                                    </td>
                                    <td className="p-5">
                                        <Badge className={`${statusColors[order.status]?.bg || 'bg-slate-100'} ${statusColors[order.status]?.text || 'text-slate-600'} capitalize font-medium`}>
                                            {order.status}
                                        </Badge>
                                    </td>
                                    <td className="p-5 text-sm text-slate-600 dark:text-slate-400">
                                        {formatDate(new Date(order.created_at))}
                                    </td>
                                    <td className="p-5 text-right">
                                        <Link
                                            href={`/dashboard/orders/${order.id}?store=${storeId}`}
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
