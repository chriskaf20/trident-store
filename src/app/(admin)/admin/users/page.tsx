import { createClient } from '@/lib/supabase/server'

export default async function AdminUsersPage() {
    const supabase = await createClient()

    const { data: users, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

    const admins = users?.filter(u => u.role === 'admin').length || 0
    const vendors = users?.filter(u => u.role === 'vendor').length || 0
    const customers = users?.filter(u => u.role === 'customer').length || 0

    return (
        <div className="p-8 md:p-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 text-slate-900 dark:text-white">Users</h2>
                    <p className="text-slate-500 font-medium tracking-wide">All registered accounts on the platform.</p>
                </div>
            </header>

            {/* Role Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                            <span className="material-symbols-outlined">group</span>
                        </div>
                        <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold px-2 py-1 rounded">Customers</span>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Customers</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{customers}</h3>
                </div>
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <span className="material-symbols-outlined">storefront</span>
                        </div>
                        <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold px-2 py-1 rounded">Vendors</span>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Vendors</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{vendors}</h3>
                </div>
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                            <span className="material-symbols-outlined">shield_person</span>
                        </div>
                        <span className="bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-1 rounded">Admins</span>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Admins</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{admins}</h3>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">All Users ({count || 0})</h3>
                </div>
                {users && users.length > 0 ? (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">User</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hidden md:table-cell">Phone</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hidden lg:table-cell">Joined</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user: any) => {
                                const roleColors: Record<string, string> = {
                                    admin: 'bg-red-500/10 text-red-600 dark:text-red-400',
                                    vendor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                                    customer: 'bg-green-500/10 text-green-600 dark:text-green-400',
                                }
                                return (
                                    <tr key={user.id} className="border-b border-slate-50 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                                                    {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{user.full_name || 'No name'}</p>
                                                    <p className="text-xs text-slate-400">{user.email || user.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 hidden md:table-cell">{user.phone || '—'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500 hidden lg:table-cell">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${roleColors[user.role] || 'bg-slate-100 text-slate-500'}`}>
                                                {user.role || 'customer'}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                        <span className="material-symbols-outlined !text-[48px] mb-4">group</span>
                        <p className="font-bold">No users yet</p>
                    </div>
                )}
            </div>
        </div>
    )
}
