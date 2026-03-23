import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const CATEGORY_MAP: Record<string, string> = {
    women: 'Women',
    men: 'Men',
    accessories: 'Accessories',
    kids: 'Kids',
    sport: 'Sport',
    casual: 'Casual',
}

export default async function CollectionPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const category = CATEGORY_MAP[slug.toLowerCase()]

    const supabase = await createClient()

    let query = supabase
        .from('products')
        .select('*, stores(name)')
        .order('created_at', { ascending: false })

    if (category) {
        query = query.eq('category', category)
    }

    const { data: products } = await query

    const displayName = category || slug.charAt(0).toUpperCase() + slug.slice(1)

    return (
        <div className="flex-1 w-full bg-background">
            {/* Header */}
            <div className="bg-slate-50 dark:bg-slate-900 border-b border-border/40 py-16 text-center px-4">
                <Link href="/products" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    All Products
                </Link>
                <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-3">
                    {displayName}
                </h1>
                <p className="text-muted-foreground">
                    {products?.length || 0} products
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {(!products || products.length === 0) ? (
                    <div className="py-24 text-center">
                        <p className="font-bold text-lg mb-2 text-slate-600">No products in this collection yet</p>
                        <p className="text-slate-500 mb-8">Check back soon or browse all products.</p>
                        <Link href="/products" className="inline-block px-8 py-4 bg-black text-white font-black uppercase tracking-widest hover:bg-primary transition-colors text-sm rounded-xl">
                            Browse All Products
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {products.map((product: any) => {
                            const hasDiscount = product.original_price && product.original_price > product.price
                            return (
                                <Link key={product.id} href={`/products/${product.id}`}>
                                    <div className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all">
                                        <div className="relative aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-800">
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Image</div>
                                            )}
                                            {hasDiscount && (
                                                <div className="absolute top-3 left-3">
                                                    <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 uppercase tracking-widest rounded">Sale</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">
                                                {(product.stores as any)?.name || 'Trident'}
                                            </p>
                                            <h3 className="font-bold text-sm truncate mb-1">{product.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <p className="font-black text-primary">{Number(product.price).toLocaleString('en-US')} TL</p>
                                                {hasDiscount && (
                                                    <p className="text-slate-400 line-through text-xs">{Number(product.original_price).toLocaleString('en-US')} TL</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
