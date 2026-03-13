import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isAdmin = profile?.role === 'admin'

    if (!isAdmin) {
        redirect('/')
    }

    const { count: pendingApplicationsCount } = await supabase
        .from('vendor_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 dark:bg-slate-950 border-r border-slate-800 text-slate-300 flex-col hidden md:flex shrink-0">
                <div className="h-20 flex items-center px-8 border-b border-white/10 dark:border-slate-800">
                    <Link href="/" className="text-xl font-black text-white uppercase tracking-widest hover:opacity-80 transition-opacity">
                        <span className="text-primary">TRIDENT</span> ADMIN
                    </Link>
                </div>

                <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2">
                    <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Core</p>
                    <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm bg-primary text-white shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined !text-[20px] text-white">dashboard</span>
                        Marketplace Overview
                    </Link>
                    <Link href="/admin/vendors" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5">
                        <span className="material-symbols-outlined !text-[20px]">storefront</span>
                        Vendor Management
                        {(pendingApplicationsCount ?? 0) > 0 && (
                            <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                                {pendingApplicationsCount}
                            </span>
                        )}
                    </Link>
                    <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5">
                        <span className="material-symbols-outlined !text-[20px]">group</span>
                        Users & Customers
                    </Link>

                    <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 mt-8">Catalog & Finance</p>
                    <Link href="/admin/products" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5">
                        <span className="material-symbols-outlined !text-[20px]">inventory_2</span>
                        Global Catalog
                    </Link>
                    <Link href="/admin/transactions" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5">
                        <span className="material-symbols-outlined !text-[20px]">payments</span>
                        Transactions & Payouts
                    </Link>

                    <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 mt-8">System</p>
                    <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5">
                        <span className="material-symbols-outlined !text-[20px]">settings</span>
                        Settings
                    </Link>
                </nav>

                <div className="p-4 border-t border-white/10 dark:border-slate-800">
                    <form action="/auth/signout" method="post">
                        <button type="submit" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 w-full text-left">
                            <span className="material-symbols-outlined !text-[20px]">logout</span>
                            Sign Out
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
