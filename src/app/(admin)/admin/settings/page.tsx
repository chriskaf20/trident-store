import { createClient } from '@/lib/supabase/server'

export default async function AdminSettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <div className="p-8 md:p-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 text-slate-900 dark:text-white">Settings</h2>
                    <p className="text-slate-500 font-medium tracking-wide">Platform configuration and admin account management.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Store Info */}
                    <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-widest">Platform Settings</h3>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Platform Name</label>
                                <input
                                    type="text"
                                    defaultValue="TRIDENT STORE"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Support Email</label>
                                <input
                                    type="email"
                                    defaultValue="support@tridentstore.com"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Platform Commission (%)</label>
                                <input
                                    type="number"
                                    defaultValue="10"
                                    min="0"
                                    max="100"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-colors"
                                />
                            </div>
                            <button className="bg-primary text-white text-sm font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
                                Save Changes
                            </button>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-widest">Payment Methods</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {[
                                { icon: 'local_shipping', label: 'Cash on Delivery', desc: 'Customer pays upon receiving the order', active: true },
                                { icon: 'store', label: 'In-Store Pickup', desc: 'Customer collects from store directly', active: true },
                                { icon: 'credit_card', label: 'Online Payment', desc: 'Stripe / credit card integration', active: false },
                            ].map((method) => (
                                <div key={method.label} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${method.active ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                            <span className="material-symbols-outlined !text-[20px]">{method.icon}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-900 dark:text-white">{method.label}</p>
                                            <p className="text-xs text-slate-400">{method.desc}</p>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors cursor-pointer ${method.active ? 'bg-primary justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'}`}>
                                        <div className="w-4 h-4 rounded-full bg-white shadow"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column — Admin Profile */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-widest">Admin Account</h3>
                        </div>
                        <div className="p-6">
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center font-black text-2xl mb-3">
                                    A
                                </div>
                                <p className="font-black text-slate-900 dark:text-white">Administrator</p>
                                <p className="text-sm text-slate-400 mt-0.5">{user?.email || ''}</p>
                                <span className="mt-2 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold px-3 py-1 rounded-full">Admin</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-3 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Last sign in</span>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                        {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : '—'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Provider</span>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 capitalize">
                                        {user?.app_metadata?.provider || 'email'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-white dark:bg-slate-950 rounded-2xl border border-red-200 dark:border-red-900/40 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-red-100 dark:border-red-900/40">
                            <h3 className="font-black text-red-600 dark:text-red-400 text-sm uppercase tracking-widest">Danger Zone</h3>
                        </div>
                        <div className="p-6 space-y-3">
                            <button className="w-full py-3 text-sm font-bold text-red-500 hover:bg-red-500/10 border border-red-200 dark:border-red-900/40 rounded-xl transition-colors">
                                Clear All Sessions
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
