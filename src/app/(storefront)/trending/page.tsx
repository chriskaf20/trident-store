import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TrendingPage() {
    const supabase = await createClient()

    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('is_trending', true)
        .order('created_at', { ascending: false })

    if (products && products.length > 0) {
        const storeIds = [...new Set(products.map((p: any) => p.store_id).filter(Boolean))];
        if (storeIds.length > 0) {
            const { data: storesData } = await supabase.from('stores').select('id, name').in('id', storeIds);
            if (storesData) {
                const storeDict: Record<string, string> = {};
                storesData.forEach(s => { storeDict[s.id] = s.name; });
                products.forEach((p: any) => {
                    p.stores = { name: storeDict[p.store_id] };
                });
            }
        }
    }

    return (
        <div className="flex-1 w-full bg-background">
            {/* Header Banner */}
            <div className="bg-black text-white py-16 md:py-24 text-center px-4">
                <div className="max-w-3xl mx-auto space-y-4">
                    <div className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-4">
                        Curated Picks
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">
                        Trending
                    </h1>
                    <p className="text-white/70 max-w-xl mx-auto text-lg">
                        The hottest pieces making waves right now.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {(!products || products.length === 0) ? (
                    <div className="py-32 text-center">
                        <span className="material-symbols-outlined !text-6xl text-slate-300 mb-6 block">trending_up</span>
                        <h2 className="text-2xl font-bold mb-2 text-slate-600">No trending products yet</h2>
                        <p className="text-slate-500 mb-8">Check back soon — our team is curating the hottest picks.</p>
                        <Link href="/products" className="inline-block px-8 py-4 bg-black text-white font-black uppercase tracking-widest hover:bg-amber-600 transition-colors text-sm">
                            Browse All Products
                        </Link>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-slate-500 font-medium mb-8">
                            Showing <span className="text-black dark:text-white font-bold">{products.length}</span> trending products
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {products.map(product => {
                                const imageUrl = product.image || ''
                                const hasDiscount = product.original_price && product.original_price > product.price
                                return (
                                    <Link key={product.id} href={`/products/${product.id}`} className="group relative bg-white dark:bg-slate-900 block transition-all hover:-translate-y-1">
                                        <div className="relative aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-800">
                                            {imageUrl ? (
                                                <img
                                                    alt={product.name}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    src={imageUrl}
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 text-xs">No Image</div>
                                            )}
                                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                                                <span className="bg-amber-600 text-white text-[10px] font-black px-2 py-1 uppercase tracking-widest">Trending</span>
                                                {hasDiscount && (
                                                    <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 uppercase tracking-widest">Sale</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="pt-3 space-y-1">
                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                                                {(product.stores as any)?.name || 'Trident'}
                                            </p>
                                            <h3 className="font-bold text-sm text-black dark:text-white line-clamp-1">{product.name}</h3>
                                            <div className="flex items-center gap-2 text-sm">
                                                <p className="text-amber-600 font-black">{Number(product.price).toLocaleString('en-US')} TL</p>
                                                {hasDiscount && (
                                                    <p className="text-slate-400 line-through text-xs">{Number(product.original_price).toLocaleString('en-US')} TL</p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
