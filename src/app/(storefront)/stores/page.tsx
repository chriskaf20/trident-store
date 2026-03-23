import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MapPin, ArrowRight, Store } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function StoresPage() {
    const supabase = await createClient()

    const { data: stores } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    const storesWithCounts = await Promise.all(
        (stores || []).map(async (store: any) => {
            const { count } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('store_id', store.id)
            return { ...store, productCount: count || 0 }
        })
    )

    return (
        <div className="flex-1 w-full bg-background">
            {/* Header */}
            <div className="bg-foreground text-background py-16 md:py-24 text-center px-4">
                <div className="max-w-3xl mx-auto space-y-4">
                    <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-4 rounded-full">
                        Marketplace
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">
                        Browse Stores
                    </h1>
                    <p className="text-background/70 max-w-xl mx-auto text-lg">
                        Discover independent creators and their unique collections.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {(!storesWithCounts || storesWithCounts.length === 0) ? (
                    <div className="py-32 text-center">
                        <Store className="w-16 h-16 text-slate-300 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold mb-2 text-slate-600">No stores yet</h2>
                        <p className="text-slate-500 mb-8">Be the first creator to open a store on Trident.</p>
                        <Link href="/vendor-apply" className="inline-block px-8 py-4 bg-black text-white font-black uppercase tracking-widest hover:bg-primary transition-colors text-sm rounded-xl">
                            Become a Vendor
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {storesWithCounts.map((store: any) => (
                            <Link key={store.id} href={`/stores/${store.slug}`}>
                                <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                                    <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                                        <div className="w-20 h-20 rounded-2xl bg-foreground text-background flex items-center justify-center font-black text-3xl shadow-lg">
                                            {store.name?.[0]?.toUpperCase() || 'S'}
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">
                                                    {store.name}
                                                </h3>
                                                {store.city && (
                                                    <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {store.city}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                        {store.description && (
                                            <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                                                {store.description}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                {store.productCount} Products
                                            </span>
                                            <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
