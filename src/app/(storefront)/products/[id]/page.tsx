import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProductGallery } from '@/components/storefront/ProductGallery'
import { ProductVariantSelector } from '@/components/storefront/ProductVariantSelector'
import { ReviewForm } from '@/components/storefront/ReviewForm'
import { Star, ShieldCheck, Truck, RotateCcw } from 'lucide-react'

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const supabase = await createClient()
    const { data: product } = await supabase
        .from('products')
        .select('name, short_description, description')
        .eq('id', params.id)
        .single()

    return { 
        title: product ? `${product.name} | Trident Store` : 'Product Not Found',
        description: product?.short_description || product?.description || 'View details for this item.'
    }
}

export default async function ProductDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const supabase = await createClient()

    const { data: product } = await supabase
        .from('products')
        .select('*, stores(name)')
        .eq('id', params.id)
        .single()

    if (!product) {
        notFound()
    }

    // Format for client component
    const formattedProduct = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        vendorId: product.store_id,
        vendorName: (product.stores as any)?.name || 'Unknown Store',
        stock: product.stock
    }

    const hasDiscount = product.original_price && product.original_price > product.price

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
                
                {/* Visuals */}
                <div className="space-y-4">
                    <ProductGallery 
                        mainImage={product.image} 
                        images={product.images || []} 
                        productName={product.name} 
                    />
                </div>

                {/* Info & Actions */}
                <div className="flex flex-col">
                    <div className="mb-8 border-b border-border/40 pb-8">
                        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">
                            {(product.stores as any)?.name || 'Unknown Store'}
                        </p>
                        <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">
                            {product.name}
                        </h1>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center text-yellow-500 text-sm font-bold">
                                <Star className="w-4 h-4 fill-current mr-1" />
                                4.8 <span className="text-muted-foreground ml-1.5 font-normal">(124 reviews)</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <p className="text-3xl font-black text-primary">
                                {Number(product.price).toLocaleString('en-US')} TL
                            </p>
                            {hasDiscount && (
                                <p className="text-lg text-slate-400 line-through font-medium">
                                    {Number(product.original_price).toLocaleString('en-US')} TL
                                </p>
                            )}
                        </div>
                        {product.short_description && (
                            <p className="text-muted-foreground mt-4 leading-relaxed text-sm">
                                {product.short_description}
                            </p>
                        )}
                    </div>

                    <div className="mb-10">
                        <ProductVariantSelector 
                            product={formattedProduct} 
                            sizes={product.sizes || []} 
                            colors={product.colors || []} 
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 py-6 border-y border-border/40">
                        <div className="flex flex-col gap-1 items-start sm:items-center sm:text-center p-2">
                            <div className="w-8 h-8 rounded-full bg-secondary text-foreground flex items-center justify-center sm:mx-auto mb-1">
                                <Truck className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold">Fast Delivery</span>
                            <span className="text-[10px] text-muted-foreground">Ships in 24h</span>
                        </div>
                        <div className="flex flex-col gap-1 items-start sm:items-center sm:text-center p-2">
                            <div className="w-8 h-8 rounded-full bg-secondary text-foreground flex items-center justify-center sm:mx-auto mb-1">
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold">Buyer Protection</span>
                            <span className="text-[10px] text-muted-foreground">Secure payment</span>
                        </div>
                        <div className="flex flex-col gap-1 items-start sm:items-center sm:text-center p-2">
                            <div className="w-8 h-8 rounded-full bg-secondary text-foreground flex items-center justify-center sm:mx-auto mb-1">
                                <RotateCcw className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold">Free Returns</span>
                            <span className="text-[10px] text-muted-foreground">Within 30 days</span>
                        </div>
                    </div>

                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                        <h3 className="text-foreground text-lg font-bold mb-3">Product Description</h3>
                        <div dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br />') }} />
                    </div>
                </div>
            </div>

            <div className="mt-20 pt-16 border-t border-border/40">
                <ReviewForm productId={product.id} />
            </div>
        </div>
    )
}
