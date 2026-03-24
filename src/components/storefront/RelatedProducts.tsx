import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { QuickAddButton } from './QuickAddButton'

interface RelatedProductsProps {
    storeId: string
    currentProductId: string
}

export async function RelatedProducts({ storeId, currentProductId }: RelatedProductsProps) {
    const supabase = await createClient()

    const { data: products } = await supabase
        .from('products')
        .select('id, name, price, original_price, image, stock, store_id')
        .eq('store_id', storeId)
        .neq('id', currentProductId)
        .gt('stock', 0)
        .limit(4)

    if (!products || products.length === 0) return null

    return (
        <div className="border-t border-border/50 pt-16 mt-4">
            <h2 className="text-2xl font-bold tracking-tight mb-6">More from this Store</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {products.map((p) => {
                    const discountPct =
                        p.original_price && p.original_price > p.price
                            ? Math.round((1 - p.price / p.original_price) * 100)
                            : null

                    return (
                        <Link
                            key={p.id}
                            href={`/products/${p.id}`}
                            className="group relative rounded-xl overflow-hidden border border-border/50 bg-secondary/10 hover:border-border transition-colors"
                        >
                            {/* Image */}
                            <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                                {p.image ? (
                                    <Image
                                        src={p.image}
                                        alt={p.name}
                                        fill
                                        sizes="(max-width: 640px) 50vw, 25vw"
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                        No image
                                    </div>
                                )}
                                {/* Discount badge */}
                                {discountPct && (
                                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        -{discountPct}%
                                    </div>
                                )}
                                {/* Quick Add */}
                                <QuickAddButton
                                    product={{
                                        id: p.id,
                                        name: p.name,
                                        price: p.price,
                                        image: p.image || '',
                                        vendorId: p.store_id || '',
                                        vendorName: '',
                                        stock: p.stock || 0,
                                    }}
                                />
                            </div>
                            {/* Info */}
                            <div className="p-3">
                                <p className="text-sm font-medium leading-snug line-clamp-2 mb-1 group-hover:underline">
                                    {p.name}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold">
                                        {Number(p.price).toLocaleString('en-US')} TL
                                    </span>
                                    {p.original_price && p.original_price > p.price && (
                                        <span className="text-xs text-muted-foreground line-through">
                                            {Number(p.original_price).toLocaleString('en-US')} TL
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
