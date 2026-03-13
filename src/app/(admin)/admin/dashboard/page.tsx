import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboardPage() {
    const supabase = await createClient()

    // Fetch real aggregates
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: storeCount } = await supabase.from('stores').select('*', { count: 'exact', head: true })
    const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true })

    // Fetch total GMV by summing price * quantity directly.
    // In Supabase we don't have a direct aggregate function via SDK without RPC,
    // so we fetch all order items to calculate (fine for early stage).
    const { data: orderItems } = await supabase.from('order_items').select('price, quantity');
    const totalGmv = orderItems?.reduce((acc, item) => acc + (item.price * item.quantity), 0) || 0;

    // Fetch real pending vendor applications
    const { data: pendingApps } = await supabase
        .from('vendor_applications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5)

    return (
        <div className="p-8 md:p-12">
            {/* Topbar inside page */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 text-slate-900 dark:text-white">Marketplace Overview</h2>
                    <p className="text-slate-500 font-medium tracking-wide">System-wide performance and recent activities.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="w-12 h-12 rounded-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 hover:text-primary transition-colors shadow-sm relative">
                        <span className="material-symbols-outlined !text-[20px]">notifications</span>
                        <span className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full"></span>
                    </button>
                    <div className="h-12 flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex justify-center items-center font-bold">A</div>
                        <div className="hidden sm:block text-sm">
                            <p className="font-bold text-slate-900 dark:text-white">Admin</p>
                            <p className="text-slate-500 text-xs text-green-500 font-bold">Online</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Total Marketplace GMV</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">${totalGmv.toLocaleString()}</h3>
                </div>

                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <span className="material-symbols-outlined">storefront</span>
                        </div>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Active Vendors</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{storeCount || 0}</h3>
                </div>

                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                            <span className="material-symbols-outlined">group</span>
                        </div>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Total Users</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{userCount || 0}</h3>
                </div>

                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                            <span className="material-symbols-outlined">shopping_cart_checkout</span>
                        </div>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Total Orders</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{orderCount || 0}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Platform Revenue */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Platform Revenue</h3>
                            <p className="text-sm text-slate-500">Commission earned across all vendors</p>
                        </div>
                        <select className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm font-bold text-slate-600 outline-none">
                            <option>This Year</option>
                            <option>Last Year</option>
                        </select>
                    </div>
                    <div className="h-72 w-full flex items-center justify-center border-slate-100 dark:border-slate-800 pb-2">
                        {orderCount === 0 ? (
                           <div className="text-center">
                               <span className="material-symbols-outlined !text-4xl text-slate-300 dark:text-slate-700 mb-2">monitoring</span>
                               <p className="text-slate-500 font-medium">No revenue data yet.</p>
                               <p className="text-xs text-slate-400 mt-1">Platform charts will appear once orders are placed.</p>
                           </div>
                        ) : (
                           <div className="text-center">
                               <p className="text-slate-500 font-medium">Loading real-time revenue metrics...</p>
                           </div>
                        )}
                    </div>
                </div>

                {/* Pending Vendor Applications */}
                <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Action Required</h3>
                        {pendingApps && pendingApps.length > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{pendingApps.length} Pending</span>
                        )}
                    </div>

                    <div className="flex-1 space-y-4">
                        {pendingApps && pendingApps.length > 0 ? (
                            pendingApps.map((app: any) => {
                                const daysAgo = Math.floor((new Date().getTime() - new Date(app.created_at).getTime()) / (1000 * 3600 * 24));
                                const timeStr = daysAgo === 0 ? 'Today' : `${daysAgo}d ago`;
                                return (
                                    <div key={app.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{app.store_name}</h4>
                                            <span className="text-xs font-bold text-slate-400">{timeStr}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                                            <span className="material-symbols-outlined !text-[14px]">location_on</span> {app.city || 'No Location'}
                                        </p>
                                        <div className="flex gap-2">
                                            <Link href="/admin/vendors" className="flex-1 bg-primary text-center text-white text-xs font-bold py-2 rounded-lg hover:bg-blue-600 transition-colors">Review</Link>
                                        </div>
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

                    <Link href="/admin/vendors" className="w-full text-center mt-6 py-3 block text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors uppercase tracking-widest">
                        View All Applications
                    </Link>
                </div>
            </div>
        </div>
    )
}
