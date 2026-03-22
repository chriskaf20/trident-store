import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboardPage() {
    const supabase = await createClient()

    const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

    const { count: storeCount } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })

    const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })

    const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

    const { data: orderItems } = await supabase
        .from('order_items')
        .select('price, quantity')

    const totalGmv = orderItems?.reduce(
        (acc: number, item: any) => acc + (Number(item.price || 0) * Number(item.quantity || 0)), 0
    ) || 0

    const { data: pendingApps } = await supabase
        .from('vendor_applications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5)

    const { data: recentOrders } = await supabase
        .from('orders')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(5)

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
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 text-slate-900 dark:text-white">
                        Marketplace Overview
                    </h2>
                    <p className="text-slate-500 font-medium tracking-wide">
                        System-wide performance and recent activities.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-12 flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex justify-center items-center font-bold">A</div>
                        <div className="hidden sm:block text-sm">
                            <p className="font-bold text-slate-900 dark:text-white">Admin</p>
                            <p className="text-xs text-green-500 font-bold">Online</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined">payments</span>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Total GMV</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                        {totalGmv.toLocaleString('en-US')} TL
                    </h3>
                </div>
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined">storefront</span>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Active Vendors</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{storeCount || 0}</h3>
                </div>
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined">group</span>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Total Users</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{userCount || 0}</h3>
                </div>
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined">inventory_2</span>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Total Products</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{productCount || 0}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Orders */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Orders</h3>
                            <p className="text-sm text-slate-500">Latest customer orders across all vendors</p>
                        </div>
                        <Link href="/admin/transactions" className="text-xs font-bold text-primary hover:underline">
                            View all
                        </Link>
                    </div>
                    {recentOrders && recentOrders.length > 0 ? (
                        <div className="space-y-3">
                            {recentOrders.map((order: any) => (
                                <div key={order.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                                            {(order.profiles as any)?.full_name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-900 dark:text-white">
                                                {(order.profiles as any)?.full_name || 'Unknown Customer'}
                                            </p>
                                            <p className="text-xs text-slate-400 font-mono">
                                                #{order.id.slice(0, 8).toUpperCase()}
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
                            <p className="text-xs mt-1">Orders will appear here once customers start buying.</p>
                        </div>
                    )}
                </div>

                {/* Pending Vendor Applications */}
                <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Action Required</h3>
                        {pendingApps && pendingApps.length > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                {pendingApps.length} Pending
                            </span>
                        )}
                    </div>
                    <div className="flex-1 space-y-3">
                        {pendingApps && pendingApps.length > 0 ? (
                            pendingApps.map((app: any) => {
                                const daysAgo = Math.floor(
                                    (new Date().getTime() - new Date(app.created_at).getTime()) / (1000 * 3600 * 24)
                                )
                                const timeStr = daysAgo === 0 ? 'Today' : `${daysAgo}d ago`
                                return (
                                    <div key={app.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{app.store_name}</h4>
                                            <span className="text-xs font-bold text-slate-400">{timeStr}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-3">
                                            {app.city || 'No Location'}
                                        </p>
                                        <Link
                                            href="/admin/vendors"
                                            className="block w-full bg-primary text-center text-white text-xs font-bold py-2 rounded-lg hover:opacity-90 transition-opacity"
                                        >
                                            Review
                                        </Link>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-center">
                                <span className="material-symbols-outlined !text-[32px] mb-2 opacity-50">check_circle</span>
                                <p className="text-sm font-bold">All caught up!</p>
                                <p className="text-xs mt-1">No pending vendor applications.</p>
                            </div>
                        )}
                    </div>
                    <Link
                        href="/admin/vendors"
                        className="w-full text-center mt-6 py-3 block text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors uppercase tracking-widest"
                    >
                        View All Applications
                    </Link>
                </div>
            </div>
        </div>
    )
}
