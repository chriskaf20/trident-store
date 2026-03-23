import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ProductsPage(props: {
    searchParams: Promise<{ category?: string; sale?: string; query?: string }>
}) {
    const searchParams = await props.searchParams
    const supabase = await createClient()

    let query = supabase.from('products').select('*')

    if (searchParams.category) {
        query = query.eq('category', searchParams.category)
    }
    if (searchParams.query) {
        query = query.ilike('name', `%${searchParams.query}%`)
    }

    const { data: products } = await query.order('created_at', { ascending: false })

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
            <div className="bg-slate-50 dark:bg-slate-900 border-b border-border/40 py-12 md:py-20 text-center px-4">
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">
                    {searchParams.category ? searchParams.category : "All Products"}
                </h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Discover unique pieces from independent creators worldwide.
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    {/* Sidebar Filters */}
                    <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg border-b border-border/40 pb-2">Categories</h3>
                            <div className="flex flex-col gap-2">
                                {["Women", "Men", "Accessories", "Kids", "Sport", "Casual"].map((cat, i) => (
                                    <Link
                                        key={cat}
                                        href={`/products?category=${cat}`}
                                        className={`flex items-center gap-3 text-sm font-medium hover:text-primary transition-colors py-1 ${searchParams.category === cat ? 'text-primary font-bold' : 'text-slate-500'}`}
                                    >
                                        {cat}
                                    </Link>
                                ))}
                                <Link
                                    href="/products"
                                    className="text-sm font-medium text-slate-400 hover:text-primary transition-colors py-1"
                                >
                                    View All
                                </Link>
                            </div>
                        </div>
                    </aside>

                    {/* Product Grid */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-8">
                            <p className="text-sm text-muted-foreground font-medium">
                                Showing <span className="text-foreground font-bold">{products?.length || 0}</span> products
                            </p>
                        </div>

                        {(!products || products.length === 0) ? (
                            <div className="py-20 text-center text-neutral-500">
                                <span className="material-symbols-outlined !text-5xl text-slate-300 mb-4 block">inventory_2</span>
                                <p className="font-bold text-lg mb-2">No products found</p>
                                <p className="text-sm">Try a different category or check back later.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                                {products.map(product => {
                                    const imageUrl = product.image || ''
                                    const hasDiscount = product.original_price && product.original_price > product.price
                                    return (
                                        <div key={product.id} className="group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all hover:shadow-xl hover:shadow-primary/5">
                                            <Link href={`/products/${product.id}`} className="block relative aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-800">
                                                {imageUrl ? (
                                                    <img
                                                        alt={product.name}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                        src={imageUrl}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 text-xs">No Image</div>
                                                )}
                                                {hasDiscount && (
                                                    <div className="absolute top-3 left-3">
                                                        <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 uppercase tracking-widest">Sale</span>
                                                    </div>
                                                )}
                                            </Link>
                                            <div className="p-4">
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">
                                                    {(product.stores as any)?.name || 'Unknown Store'}
                                                </p>
                                                <h3 className="font-bold text-sm mb-1.5 truncate">{product.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-base text-primary">
                                                        {Number(product.price).toLocaleString('en-US')} TL
                                                    </p>
                                                    {hasDiscount && (
                                                        <p className="text-slate-400 line-through text-sm">
                                                            {Number(product.original_price).toLocaleString('en-US')} TL
                                                        </p>
                                                    )}
                                                </div>
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
