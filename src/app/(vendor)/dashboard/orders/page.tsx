import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Inbox } from 'lucide-react'

export default async function VendorOrdersPage() {
    const supabase = await createClient()

    // RLS will ensure the vendor only sees orders associated with their store
    const { data: orders } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
                <p className="text-muted-foreground mt-1">Manage customer fulfillments and track offline payments</p>
            </div>

            <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border/50 bg-secondary/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    <th className="p-5 font-medium">Order ID</th>
                                    <th className="p-5 font-medium">Customer</th>
                                    <th className="p-5 font-medium">Items</th>
                                    <th className="p-5 font-medium">Total</th>
                                    <th className="p-5 font-medium">Status</th>
                                    <th className="p-5 font-medium text-right">Delivery</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {(!orders || orders.length === 0) ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="p-4 rounded-full bg-secondary/50">
                                                    <Inbox className="w-8 h-8 text-muted-foreground/50" />
                                                </div>
                                                <p>No orders yet. Fulfillments will appear here once customers checkout.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-secondary/10 transition-colors">
                                            <td className="p-5 font-mono text-xs font-bold text-foreground">
                                                #{order.id.split('-')[0].toUpperCase()}
                                            </td>
                                            <td className="p-5">
                                                <div className="font-semibold text-sm">{order.first_name} {order.last_name}</div>
                                                <div className="text-xs text-muted-foreground mr-6 truncate max-w-[150px]">{order.email}</div>
                                            </td>
                                            <td className="p-5 text-sm font-medium">
                                                {order.order_items?.length || 0} item(s)
                                            </td>
                                            <td className="p-5 font-bold text-sm">
                                                {order.total_amount.toLocaleString()} TL
                                            </td>
                                            <td className="p-5">
                                                <Badge variant={
                                                    order.status === 'pending' ? 'outline' :
                                                        order.status === 'ready' ? 'secondary' :
                                                            'success'
                                                }>
                                                    {order.status}
                                                </Badge>
                                            </td>
                                            <td className="p-5 text-sm font-semibold text-right text-muted-foreground">
                                                {order.delivery_method === 'cod' ? 'Cash on Delivery' : 'In-Store Pickup'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
