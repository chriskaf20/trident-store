import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Instagram, MessageCircle } from 'lucide-react'

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
    const supabase = await createClient()
    const { slug } = await params

    // Fetch store details by slug
    const { data: store } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .single()

    if (!store) {
        notFound()
    }

    // Fetch products for this store
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })

    return (
        <div className="flex-1 animate-in fade-in">
            {/* Store Header / Banner */}
            <div className="h-64 md:h-96 w-full bg-neutral-200 relative">
                {store.banner_url ? (
                    <img src={store.banner_url} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-neutral-800 to-neutral-900" />
                )}
            </div>

            <div className="max-w-7xl mx-auto px-6 pb-24">
                {/* Store Info Container */}
                <div className="relative flex flex-col md:flex-row gap-8 items-start md:items-end -mt-16 md:-mt-24 mb-16">
                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden shrink-0">
                        {store.logo_url ? (
                            <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-4xl text-neutral-300">
                                {store.name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 pb-4">
                        <h1 className="text-4xl md:text-5xl font-bold mb-2">{store.name}</h1>
                        <p className="text-neutral-500 max-w-2xl text-lg mb-4">{store.description || store.story}</p>

                        <div className="flex flex-wrap gap-4 text-sm font-medium text-neutral-600">
                            {store.city && (
                                <span className="flex items-center gap-1 bg-neutral-100 px-3 py-1 rounded-full"><MapPin className="w-4 h-4" /> {store.city}</span>
                            )}
                            {store.instagram && (
                                <a href={store.instagram} className="flex items-center gap-1 bg-pink-50 text-pink-700 px-3 py-1 rounded-full hover:bg-pink-100 transition-colors"><Instagram className="w-4 h-4" /> Instagram</a>
                            )}
                            {store.whatsapp && (
                                <a href={`https://wa.me/${store.whatsapp}`} className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full hover:bg-green-100 transition-colors"><MessageCircle className="w-4 h-4" /> WhatsApp</a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Separator / Filter Bar Area */}
                <div className="border-t border-b border-neutral-200 py-4 mb-12 flex justify-between text-sm uppercase tracking-wider font-semibold">
                    <span>{products?.length || 0} Products</span>
                    <div className="flex gap-4">
                        <span className="cursor-pointer text-neutral-500 hover:text-black">All</span>
                        <span className="cursor-pointer text-neutral-500 hover:text-black">New</span>
                        <span className="cursor-pointer text-neutral-500 hover:text-black">Sale</span>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
                    {products?.map((product) => (
                        <Link key={product.id} href={`/products/${product.id}`} className="group block">
                            <div className="aspect-[3/4] bg-neutral-200 mb-4 overflow-hidden relative">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">No Image</div>
                                )}
                            </div>
                            <h3 className="font-medium truncate mb-1">{product.name}</h3>
                            <p className="text-sm border-t border-neutral-200 pt-2 mt-2">${product.price}</p>
                        </Link>
                    ))}
                </div>

                {products?.length === 0 && (
                    <div className="text-center py-24 text-neutral-500">
                        This store hasn't uploaded any products yet.
                    </div>
                )}
            </div>
        </div>
    )
}
