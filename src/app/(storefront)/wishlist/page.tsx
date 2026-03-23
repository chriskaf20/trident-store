import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Heart, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { removeFromWishlist } from './actions'
import { redirect } from 'next/navigation'

export default async function WishlistPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Fetch wishlist items with their associated products
    const { data: wishlist } = await supabase
        .from('wishlist')
        .select(`
            id,
            product_id,
            created_at,
            products (
                id,
                name,
                price,
                image,
                stores (
                    name
                )
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 animate-in fade-in">
            <div className="flex items-center gap-3 mb-10">
                <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Your Wishlist</h1>
            </div>

            {!wishlist || wishlist.length === 0 ? (
                <div className="text-center py-24 bg-secondary/20 rounded-2xl border border-border/50">
                    <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold mb-2">No saved items</h2>
                    <p className="text-muted-foreground mb-8">Items you favorite will be saved here for later.</p>
                    <Link href="/">
                        <Button size="lg" className="shadow-xl">Explore Products</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {wishlist.map((item: any) => (
                        <div key={item.id} className="group flex flex-col gap-4">
                            <Link href={`/products/${item.product_id}`} className="relative aspect-[4/5] overflow-hidden rounded-xl bg-secondary">
                                {item.products.image ? (
                                    <img
                                        src={item.products.image}
                                        alt={item.products.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No Image</div>
                                )}

                                {/* Remove from wishlist button overlay */}
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <form action={async () => {
                                        "use server"
                                        await removeFromWishlist(item.id)
                                    }}>
                                        <button className="w-10 h-10 bg-white/90 text-black rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-colors shadow-sm">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </Link>
                            <div>
                                <h3 className="font-bold text-foreground line-clamp-1">{item.products.name}</h3>
                                <p className="text-sm text-muted-foreground truncate mb-1">{item.products.stores?.name}</p>
                                <span className="font-semibold">{item.products.price.toLocaleString()} TL</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
