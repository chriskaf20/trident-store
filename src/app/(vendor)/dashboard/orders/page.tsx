import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Inbox } from 'lucide-react'

export default async function VendorOrdersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id)
        .limit(1)
        .maybeSingle()

    const { data: orders } = store ? await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false }) : { data: null }

    return (
        <div className="p-8 md:p-12 space-y-8">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter">Orders</h1>
                <p className="text-slate-500 font-medium mt-1">Manage customer fulfillments and track offline payments</p>
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
                                    orders.map((order: any) => (
                                        <tr key={order.id} className="hover:bg-secondary/10 transition-colors">
                                            <td className="p-5 font-mono text-xs font-bold text-foreground">
                                                #{order.id.slice(0, 8).toUpperCase()}
                                            </td>
                                            <td className="p-5">
                                                <div className="font-semibold text-sm">
                                                    {order.first_name} {order.last_name}
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                    {order.email}
                                                </div>
                                            </td>
                                            <td className="p-5 text-sm font-medium">
                                                {order.order_items?.length || 0} item(s)
                                            </td>
                                            <td className="p-5 font-bold text-sm">
                                                {Number(order.total_amount || 0).toLocaleString('en-US')} TL
                                            </td>
                                            <td className="p-5">
                                                <Badge variant={
                                                    order.status === 'delivered' ? 'success' :
                                                    order.status === 'cancelled' ? 'destructive' :
                                                    'outline'
                                                }>
                                                    {order.status || 'pending'}
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
