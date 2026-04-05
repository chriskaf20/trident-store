import { createClient } from '@/lib/supabase/server'
import { updateStoreSettings } from '../actions'
import { EmptyStoreState } from '@/components/dashboard/EmptyStoreState'
import { redirect } from 'next/navigation'

export default async function VendorSettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: store } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()

    if (!store) {
        return <EmptyStoreState />
    }

    return (
        <div className="p-8 md:p-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 text-slate-900 dark:text-white">Store Settings</h2>
                    <p className="text-slate-500 font-medium tracking-wide">Manage your storefront details and contact information.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Settings Form */}
                <div className="lg:col-span-2">
                    <form action={updateStoreSettings} className="space-y-6">
                        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-widest">Store Information</h3>
                            </div>
                            <div className="p-6 space-y-5">
                                <div>
                                    <label htmlFor="name" className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Store Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        defaultValue={store.name}
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Store Description</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        defaultValue={store.description}
                                        required
                                        rows={4}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-colors resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="city" className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">City</label>
                                        <input
                                            type="text"
                                            id="city"
                                            name="city"
                                            defaultValue={store.city}
                                            required
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="whatsapp" className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">WhatsApp Number</label>
                                        <input
                                            type="text"
                                            id="whatsapp"
                                            name="whatsapp"
                                            defaultValue={store.whatsapp}
                                            required
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="instagram" className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Instagram Handle (Optional)</label>
                                    <input
                                        type="text"
                                        id="instagram"
                                        name="instagram"
                                        defaultValue={store.instagram}
                                        placeholder="@yourstore"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                                <div className="pt-4">
                                    <button type="submit" className="bg-primary text-white text-sm font-bold px-8 py-4 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
                                        Save All Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Account Summary */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-widest">Account Details</h3>
                        </div>
                        <div className="p-6">
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-2xl mb-3 border-2 border-primary/20">
                                    {store.name?.[0].toUpperCase()}
                                </div>
                                <p className="font-black text-slate-900 dark:text-white">{store.name}</p>
                                <p className="text-sm text-slate-400 mt-0.5">{user.email}</p>
                                <span className="mt-3 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-primary/10">Verified Vendor</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-3 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Store Slug</span>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                        /{store.slug}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Created At</span>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                        {new Date(store.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-4 space-y-2">
                            <a href={`/stores/${store.slug}`} target="_blank" className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">visibility</span>
                                    <span className="text-sm font-bold">View Public Store</span>
                                </div>
                                <span className="material-symbols-outlined text-slate-300 text-sm">open_in_new</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
