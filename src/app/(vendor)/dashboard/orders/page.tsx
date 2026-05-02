import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Inbox, MapPin, Phone, Mail, Package, User } from 'lucide-react'
import { getVendorOrders } from '../order-actions'
import { OrderItemActions } from './components/OrderItemActions'

export default async function VendorOrdersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: store } = await supabase
        .from('vendors')
        .select('id')
        .eq('owner_id', user?.id)
        .limit(1)
        .maybeSingle()

    if (!store) {
        return (
            <div className="p-8 md:p-12 text-center">
                <p>You don't have a store yet.</p>
            </div>
        )
    }

    const { orders } = await getVendorOrders(store.id)

    return (
        <div className="p-8 md:p-12 space-y-8">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter">Orders & Fulfillments</h1>
                <p className="text-slate-500 font-medium mt-1">Manage customer orders and track delivery status</p>
            </div>

            <div className="space-y-6">
                {(!orders || orders.length === 0) ? (
                    <Card className="border-border/50 shadow-sm">
                        <CardContent className="p-12 text-center text-muted-foreground">
                            <div className="flex flex-col items-center justify-center gap-3">
                                <div className="p-4 rounded-full bg-secondary/50">
                                    <Inbox className="w-8 h-8 text-muted-foreground/50" />
                                </div>
                                <p>No orders yet. Fulfillments will appear here once customers checkout.</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    orders.map((order: any) => (
                        <Card key={order.id} className="border-border/50 shadow-md overflow-hidden hover:border-primary/20 transition-colors">
                            <div className="bg-secondary/20 p-4 border-b border-border/50 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <span className="font-mono font-bold text-xs bg-background px-2 py-1 rounded border border-border">
                                        #{order.id.slice(0, 8).toUpperCase()}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-medium">
                                        {new Date(order.created_at).toLocaleString()}
                                    </span>
                                    <Badge variant={order.delivery_method === 'cod' ? 'default' : 'outline'} className="text-[10px] uppercase">
                                        {order.delivery_method === 'cod' ? 'Cash on Delivery' : 'Pickup'}
                                    </Badge>
                                </div>
                                <div className="font-bold text-lg">
                                    {Number(order.total_amount || 0).toLocaleString()} TL
                                </div>
                            </div>
                            
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Customer Info */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <User className="w-3 h-3" /> Customer Info
                                        </h4>
                                        <div className="space-y-2">
                                            <p className="font-bold text-sm">{order.first_name} {order.last_name}</p>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Mail className="w-3 h-3" /> {order.email || 'No email provided'}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Phone className="w-3 h-3" /> {order.phone || 'No phone provided'}
                                            </div>
                                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                                <MapPin className="w-3 h-3 mt-1 shrink-0" />
                                                <span className="leading-tight">{order.address}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items & Actions */}
                                    <div className="lg:col-span-2 space-y-4">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Package className="w-3 h-3" /> Your Items
                                        </h4>
                                        <div className="divide-y divide-border/30 border border-border/30 rounded-xl overflow-hidden">
                                            {order.items.map((item: any) => (
                                                <div key={item.id} className="p-4 bg-secondary/5 flex items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <p className="font-bold text-sm">{item.product_name}</p>
                                                        <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {item.price.toLocaleString()} TL</p>
                                                    </div>
                                                    <div className="shrink-0">
                                                        <OrderItemActions 
                                                            orderId={order.id} 
                                                            itemId={item.id} 
                                                            currentStatus={item.status} 
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
