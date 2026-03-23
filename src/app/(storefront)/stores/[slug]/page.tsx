import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, ArrowLeft, Instagram, Phone } from 'lucide-react'

export default async function StoreDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: store } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (!store) notFound()

    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })

    return (
        <div className="flex-1 w-full bg-background">
            {/* Store Header */}
            <div className="bg-foreground text-background py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <Link href="/stores" className="inline-flex items-center gap-2 text-background/60 hover:text-background text-sm font-medium mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        All Stores
                    </Link>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-white/10 text-white flex items-center justify-center font-black text-3xl">
                            {store.name?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">
                                {store.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-background/60 text-sm">
                                {store.city && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {store.city}
                                    </span>
                                )}
                                {store.instagram && (
                                    <a
                                        href={`https://instagram.com/${store.instagram.replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 hover:text-background transition-colors"
                                    >
                                        <Instagram className="w-4 h-4" />
                                        {store.instagram}
                                    </a>
                                )}
                                {store.whatsapp && (
                                    <a
                                        href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 hover:text-background transition-colors"
                                    >
                                        <Phone className="w-4 h-4" />
                                        WhatsApp
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                    {store.description && (
                        <p className="text-background/70 mt-6 max-w-2xl text-base leading-relaxed">
                            {store.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Products */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">
                        Products ({products?.length || 0})
                    </h2>
                </div>

                {(!products || products.length === 0) ? (
                    <div className="py-24 text-center bg-secondary/20 rounded-2xl border border-border">
                        <p className="font-bold text-lg mb-2">No products yet</p>
                        <p className="text-sm text-muted-foreground">This store is setting up. Check back soon.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {products.map((product: any) => (
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
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-sm truncate mb-1">{product.name}</h3>
                                        <p className="font-black text-primary">{Number(product.price).toLocaleString('en-US')} TL</p>
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
