import { createClient } from '@/lib/supabase/server'

export default async function AdminTransactionsPage() {
    const supabase = await createClient()

    const { data: orders, count } = await supabase
        .from('orders')
        .select('*, profiles(full_name, email)', { count: 'exact' })
        .order('created_at', { ascending: false })

    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
        confirmed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        processing: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
        shipped: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
        delivered: 'bg-green-500/10 text-green-600 dark:text-green-400',
        cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400',
        refunded: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    }

    const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0
    const pendingCount = orders?.filter(o => o.status === 'pending').length || 0
    const deliveredCount = orders?.filter(o => o.status === 'delivered').length || 0

    return (
        <div className="p-8 md:p-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 text-slate-900 dark:text-white">Transactions</h2>
                    <p className="text-slate-500 font-medium tracking-wide">All orders and payment activity across the marketplace.</p>
                </div>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined">payments</span>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Total Revenue</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">${totalRevenue.toFixed(2)}</h3>
                </div>
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined">pending_actions</span>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Pending Orders</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{pendingCount}</h3>
                </div>
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined">local_shipping</span>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Delivered</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{deliveredCount}</h3>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">All Orders ({count || 0})</h3>
                </div>
                {orders && orders.length > 0 ? (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Order ID</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hidden md:table-cell">Customer</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hidden lg:table-cell">Date</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Amount</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order: any) => (
                                <tr key={order.id} className="border-b border-slate-50 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-900 dark:text-white text-sm font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                                        <p className="text-xs text-slate-400 capitalize">{order.payment_method?.replace(/_/g, ' ') || 'N/A'}</p>
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell">
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{(order.profiles as any)?.full_name || 'Unknown'}</p>
                                        <p className="text-xs text-slate-400">{(order.profiles as any)?.email || ''}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 hidden lg:table-cell">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-black text-slate-900 dark:text-white text-sm">${Number(order.total_amount || 0).toFixed(2)}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${statusColors[order.status] || 'bg-slate-100 text-slate-500'}`}>
                                            {order.status || 'pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                        <span className="material-symbols-outlined !text-[48px] mb-4">receipt_long</span>
                        <p className="font-bold">No orders yet</p>
                        <p className="text-sm mt-1">Customer orders will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
