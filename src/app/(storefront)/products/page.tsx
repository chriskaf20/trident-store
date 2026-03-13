import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ProductsPage(props: {
    searchParams: Promise<{ category?: string; sale?: string; query?: string }>
}) {
    const searchParams = await props.searchParams;
    const supabase = await createClient()

    let query = supabase.from('products').select('*, stores(name)')

    if (searchParams.category) {
        query = query.eq('category', searchParams.category)
    }
    if (searchParams.query) {
        query = query.ilike('name', `%${searchParams.query}%`)
    }

    const { data: products, error } = await query

    return (
        <div className="flex-1 w-full bg-background">
            {/* Header Banner */}
            <div className="bg-slate-50 dark:bg-slate-900 border-b border-border/40 py-12 md:py-20 text-center px-4">
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">
                    {searchParams.category ? searchParams.category : "Spring Essentials"}
                </h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Curated pieces for the new season. Discover lightweight fabrics and bold colors.
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

                    {/* Sidebar Filters */}
                    <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
                        {/* Categories */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg border-b border-border/40 pb-2">Categories</h3>
                            <div className="flex flex-col gap-2">
                                {["All Clothing", "Women", "Men", "Accessories", "Dresses", "Tops & Blouses", "Outerwear"].map((cat, i) => (
                                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary" defaultChecked={i === 0} />
                                        <span className={`text-sm font-medium group-hover:text-primary transition-colors ${i === 0 ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>{cat}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Size */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg border-b border-border/40 pb-2">Size</h3>
                            <div className="flex flex-wrap gap-2">
                                {["XS", "S", "M", "L", "XL", "XXL"].map((sz, i) => (
                                    <button key={sz} className={`w-10 h-10 rounded-md border flex items-center justify-center text-sm font-medium transition-all ${i === 1 ? 'bg-primary text-white border-primary shadow-md' : 'border-slate-200 dark:border-slate-800 hover:border-primary hover:text-primary'}`}>{sz}</button>
                                ))}
                            </div>
                        </div>

                        {/* Price */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg border-b border-border/40 pb-2">Price Range</h3>
                            <div className="px-2 pt-2">
                                <input type="range" className="w-full accent-primary" min="0" max="500" defaultValue="250" />
                                <div className="flex items-center justify-between text-sm font-medium mt-4">
                                    <span>$0</span>
                                    <span className="text-primary font-bold">$250</span>
                                    <span>$500+</span>
                                </div>
                            </div>
                        </div>

                        <button className="w-full py-3 bg-secondary text-secondary-foreground font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                            Clear Filters
                        </button>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1">
                        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                            <p className="text-sm text-muted-foreground font-medium">
                                Showing <span className="text-foreground font-bold">{products?.length || 0}</span> products
                            </p>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Sort by:</span>
                                <select className="w-full sm:w-auto bg-transparent border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm font-medium focus:ring-primary focus:border-primary outline-none">
                                    <option>Recommended</option>
                                    <option>Newest Arrivals</option>
                                    <option>Price: Low to High</option>
                                    <option>Price: High to Low</option>
                                </select>
                            </div>
                        </div>

                        {/* Product Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">

                            {products?.map(product => {
                                const imageUrl = (product.images && product.images[0]) || ''
                                const hasDiscount = product.original_price && product.original_price > product.price
                                return (
                                    <div key={product.id} className="group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all hover:shadow-xl hover:shadow-primary/5">
                                        <Link href={`/products/${product.id}`} className="block relative aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-800">
                                            {imageUrl ? (
                                                <img alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={imageUrl} />
                                            ) : (
                                                <div className="w-full h-full bg-slate-200 dark:bg-slate-700" />
                                            )}
                                            {hasDiscount && (
                                                <div className="absolute top-3 left-3">
                                                    <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 uppercase tracking-widest">Sale</span>
                                                </div>
                                            )}
                                            <button className="absolute top-3 right-3 size-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-full flex items-center justify-center text-slate-900 dark:text-white shadow-sm hover:bg-white hover:text-primary transition-all">
                                                <span className="material-symbols-outlined !text-[20px]">favorite</span>
                                            </button>
                                            <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                                <button className="w-full py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-white font-bold rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2 text-sm">
                                                    <span className="material-symbols-outlined !text-[20px]">shopping_bag</span> Add to Cart
                                                </button>
                                            </div>
                                        </Link>
                                        <div className="p-4">
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">
                                                {(product.stores as any)?.name || 'Unknown Store'}
                                            </p>
                                            <h3 className="font-bold text-sm mb-1.5 truncate">{product.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <p className="font-black text-base text-primary">${product.price}</p>
                                                {hasDiscount && (
                                                    <p className="text-slate-400 line-through text-sm">${product.original_price}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            {(!products || products.length === 0) && (
                                <div className="col-span-full py-20 text-center text-neutral-500">
                                    No products found matching your criteria.
                                </div>
                            )}

                        </div>

                        {/* Pagination if needed */}
                        <div className="mt-12 flex justify-center">
                            <button className="px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                Load More Products
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
