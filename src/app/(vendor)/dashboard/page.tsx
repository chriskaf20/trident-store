import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { EmptyStoreState } from '@/components/dashboard/EmptyStoreState'

export default async function VendorDashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Safely query for the store, even if duplicates exist (though we deduplicated)
    const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('*') // Removed products(count) and orders(count) as the FK join is missing in DB
        .eq('owner_id', user?.id)
        .limit(1)
        .maybeSingle()

    console.log('PAGE STORE CHECK:', { 
        userId: user?.id, 
        hasStore: !!store, 
        storeName: store?.name,
        error: storeError
    })

    if (!store) {
        return <EmptyStoreState />
    }

    // Fetch counts in separate queries to avoid broken joins
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
        .limit(4)

    return (
        <div className="p-8 md:p-12">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Dashboard Overview</h2>
                    <p className="text-slate-500 font-medium">Here's what's happening with your store today.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="w-12 h-12 rounded-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 hover:text-primary transition-colors shadow-sm relative">
                        <span className="material-symbols-outlined !text-[20px]">notifications</span>
                        <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>
                    <div className="h-12 flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
                        <img src="https://ui-avatars.com/api/?name=Vendor&background=135bec&color=fff" alt="Vendor" className="w-10 h-10 rounded-full shadow-sm" />
                        <div className="hidden sm:block text-sm">
                            <p className="font-bold">{store.name}</p>
                            <p className="text-slate-500 text-xs">Vendor</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {/* Stat Card 1 */}
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:border-primary/50 transition-colors">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Total Sales (Month)</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">$12,450</h3>
                            <div className="flex items-center gap-1 text-sm font-bold text-green-500">
                                <span className="material-symbols-outlined !text-[16px]">trending_up</span>
                                <span>+14.5%</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                    </div>
                </div>

                {/* Stat Card 2 */}
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:border-primary/50 transition-colors">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Active Orders</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{orderCount || 0}</h3>
                            <div className="flex items-center gap-1 text-sm font-bold text-green-500">
                                <span className="material-symbols-outlined !text-[16px]">trending_up</span>
                                <span>+5%</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                            <span className="material-symbols-outlined">local_shipping</span>
                        </div>
                    </div>
                </div>

                {/* Stat Card 3 */}
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:border-primary/50 transition-colors">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Total Products</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{productCount || 0}</h3>
                            <div className="flex items-center gap-1 text-sm font-bold text-slate-400">
                                <span>Up to date</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <span className="material-symbols-outlined">inventory_2</span>
                        </div>
                    </div>
                </div>

                {/* Stat Card 4 */}
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:border-primary/50 transition-colors">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Store Rating</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{store.rating ?? '5.0'}</h3>
                            <div className="flex items-center gap-1 text-sm font-bold text-slate-400">
                                <span>Based on 124 reviews</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                            <span className="material-symbols-outlined">star</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Overview */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold">Revenue Overview & Recent Activity</h3>
                    </div>
                    
                    <div className="h-64 w-full flex items-center justify-center border-slate-100 dark:border-slate-800 pb-2">
                        {orderCount === 0 ? (
                           <div className="text-center">
                               <span className="material-symbols-outlined !text-4xl text-slate-300 dark:text-slate-700 mb-2">monitoring</span>
                               <p className="text-slate-500 font-medium">No revenue data yet.</p>
                               <p className="text-xs text-slate-400 mt-1">Charts will appear once you receive orders.</p>
                           </div>
                        ) : (
                           <div className="text-center">
                               <p className="text-slate-500 font-medium">Loading real-time revenue metrics...</p>
                           </div>
                        )}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold">Recent Orders</h3>
                        <Link href="/dashboard/orders" className="text-sm font-bold text-primary hover:underline">View All</Link>
                    </div>

                    <div className="space-y-6">
                        {orderCount === 0 ? (
                            <div className="text-center py-6">
                                <span className="material-symbols-outlined !text-3xl text-slate-300 dark:text-slate-700 mb-2">package</span>
                                <p className="text-slate-500 text-sm font-medium">No recent orders</p>
                            </div>
                        ) : (
                            <div className="space-y-4 text-slate-500">
                                {recentOrders?.map((order) => {
                                    const date = new Date(order.created_at)
                                    const timeStr = date.toLocaleDateString()
                                    return (
                                        <div key={order.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500">
                                                    <span className="material-symbols-outlined">receipt_long</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm mb-1 text-slate-900 dark:text-white">Order #{order.id.slice(0,6)}</p>
                                                    <p className="text-xs text-slate-500 font-medium">{timeStr}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-primary mb-1">${order.total_amount || '0.00'}</p>
                                                <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded ${order.status === 'completed' ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}`}>
                                                    {order.status || 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
