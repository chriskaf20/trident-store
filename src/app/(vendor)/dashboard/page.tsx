import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { EmptyStoreState } from '@/components/dashboard/EmptyStoreState'

export default async function VendorDashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: store } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user?.id)
        .limit(1)
        .maybeSingle()

    if (!store) {
        return <EmptyStoreState />
    }

    const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)

    const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)

    const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, created_at, total_amount, status')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })
        .limit(5)

    const totalRevenue = recentOrders?.reduce(
        (sum, o) => sum + Number(o.total_amount || 0), 0
    ) || 0

    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-500/10 text-yellow-600',
        confirmed: 'bg-blue-500/10 text-blue-600',
        processing: 'bg-purple-500/10 text-purple-600',
        shipped: 'bg-indigo-500/10 text-indigo-600',
        delivered: 'bg-green-500/10 text-green-600',
        cancelled: 'bg-red-500/10 text-red-600',
    }

    return (
        <div className="p-8 md:p-12">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Dashboard Overview</h2>
                    <p className="text-slate-500 font-medium">Here is what is happening with your store today.</p>
                </div>
                <div className="h-12 flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                        {store.name?.[0]?.toUpperCase() || 'V'}
                    </div>
                    <div className="hidden sm:block text-sm">
                        <p className="font-bold">{store.name}</p>
                        <p className="text-slate-500 text-xs">Vendor</p>
                    </div>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined">payments</span>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Total Revenue</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                        {totalRevenue.toLocaleString('en-US')} TL
                    </h3>
                </div>

                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined">local_shipping</span>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Total Orders</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{orderCount || 0}</h3>
                </div>

                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined">inventory_2</span>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Total Products</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{productCount || 0}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Actions */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="text-lg font-bold mb-6">Quick Actions</h3>
                    <div className="space-y-3">
                        <Link href="/dashboard/products/new" className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <span className="material-symbols-outlined !text-[20px]">add_circle</span>
                            </div>
                            <div>
                                <p className="font-bold text-sm text-slate-900 dark:text-white">Add New Product</p>
                                <p className="text-xs text-slate-400">List a new item in your store</p>
                            </div>
                        </Link>
                        <Link href="/dashboard/orders" className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                                <span className="material-symbols-outlined !text-[20px]">receipt_long</span>
                            </div>
                            <div>
                                <p className="font-bold text-sm text-slate-900 dark:text-white">View Orders</p>
                                <p className="text-xs text-slate-400">Manage customer fulfillments</p>
                            </div>
                        </Link>
                        <Link href="/dashboard/settings" className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                                <span className="material-symbols-outlined !text-[20px]">settings</span>
                            </div>
                            <div>
                                <p className="font-bold text-sm text-slate-900 dark:text-white">Store Settings</p>
                                <p className="text-xs text-slate-400">Update your store details</p>
                            </div>
                        </Link>
                        <a href={`/stores/${store.slug}`} target="_blank" className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
                                <span className="material-symbols-outlined !text-[20px]">storefront</span>
                            </div>
                            <div>
                                <p className="font-bold text-sm text-slate-900 dark:text-white">View Public Store</p>
                                <p className="text-xs text-slate-400">See how customers see you</p>
                            </div>
                        </a>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold">Recent Orders</h3>
                        <Link href="/dashboard/orders" className="text-sm font-bold text-primary hover:underline">
                            View All
                        </Link>
                    </div>
                    {recentOrders && recentOrders.length > 0 ? (
                        <div className="space-y-3">
                            {recentOrders.map((order: any) => (
                                <div key={order.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <span className="material-symbols-outlined !text-[18px] text-slate-400">receipt_long</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                                                #{order.id.slice(0, 8).toUpperCase()}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-sm text-slate-900 dark:text-white">
                                            {Number(order.total_amount || 0).toLocaleString('en-US')} TL
                                        </p>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${statusColors[order.status] || 'bg-slate-100 text-slate-500'}`}>
                                            {order.status || 'pending'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                            <span className="material-symbols-outlined !text-[40px] mb-3 opacity-40">receipt_long</span>
                            <p className="text-sm font-bold">No orders yet</p>
                            <p className="text-xs mt-1">Orders will appear here once customers buy from your store.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
