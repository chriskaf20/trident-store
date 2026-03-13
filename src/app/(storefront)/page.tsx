import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600

export default async function HomePage() {
    const supabase = await createClient()

    const { data: trendingProducts } = await supabase
        .from('products')
        .select('*, stores(name)')
        .eq('is_trending', true)
        .limit(4)

    const displayTrending = trendingProducts && trendingProducts.length > 0 ? trendingProducts : []

    return (
        <div className="flex-1 w-full">

            {/* ── HERO ─────────────────────────────────────────── */}
            <section className="relative w-full min-h-[92vh] flex items-end overflow-hidden bg-black">
                {/* Background image */}
                <div className="absolute inset-0 z-0">
                    <img
                        alt="Trident Store hero – premium fashion"
                        className="w-full h-full object-cover object-center opacity-70"
                        src="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=2076&auto=format&fit=crop"
                    />
                    {/* layered gradients for dramatic look */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
                </div>

                {/* Decorative side label */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-3 z-20">
                    <div className="h-24 w-px bg-white/30" />
                    <p className="text-white/50 text-[10px] font-bold tracking-[0.35em] uppercase rotate-90 origin-center whitespace-nowrap">New Season 2025</p>
                    <div className="h-24 w-px bg-white/30" />
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 hidden md:flex flex-col items-center gap-2 text-white/40">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Scroll</span>
                    <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
                </div>

                {/* Content */}
                <div className="relative z-20 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full pb-20 md:pb-28">
                    <div className="max-w-3xl space-y-6">
                        {/* Eyebrow label */}
                        <div className="inline-flex items-center gap-2">
                            <span className="block h-px w-8 bg-amber-500" />
                            <span className="text-amber-400 text-xs font-black uppercase tracking-[0.3em]">Trident Store — SS 2025</span>
                        </div>

                        {/* Main headline */}
                        <h1 className="text-[clamp(3rem,8vw,6rem)] font-black text-white leading-[0.95] tracking-tighter uppercase">
                            Style That <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 italic">Demands</span>
                            <br />Attention
                        </h1>

                        <p className="text-white/70 text-base sm:text-lg font-medium max-w-md leading-relaxed">
                            Discover bold pieces from independent designers. Shop curated fashion that sets you apart.
                        </p>

                        {/* CTA buttons */}
                        <div className="flex flex-wrap gap-3 pt-2">
                            <Link
                                href="/products"
                                className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-amber-400 transition-all duration-300 shadow-2xl"
                            >
                                Shop the Drop
                                <span className="material-symbols-outlined !text-base transition-transform group-hover:translate-x-1">arrow_forward</span>
                            </Link>
                            <Link
                                href="/vendor-apply"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-transparent border border-white/40 text-white font-black uppercase tracking-widest text-sm hover:border-white hover:bg-white/10 transition-all duration-300"
                            >
                                Become a Vendor
                            </Link>
                        </div>

                        {/* Social proof strip */}
                        <div className="flex items-center gap-6 pt-6 border-t border-white/10">
                            <div className="flex -space-x-2">
                                {['photo-1494790108377-be9c29b29330', 'photo-1507003211169-0a1dd7228f2d', 'photo-1438761681033-6461ffad8d80'].map((id, i) => (
                                    <img
                                        key={i}
                                        src={`https://images.unsplash.com/${id}?w=40&h=40&fit=crop&crop=face`}
                                        alt="shopper"
                                        className="w-8 h-8 rounded-full border-2 border-black object-cover"
                                    />
                                ))}
                            </div>
                            <div>
                                <div className="flex text-amber-400 text-xs gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className="material-symbols-outlined !text-[12px] filled">star</span>
                                    ))}
                                </div>
                                <p className="text-white/50 text-xs mt-0.5">12,000+ happy shoppers</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── VALUE BAR ─────────────────────────────────────── */}
            <section className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-200 dark:divide-slate-800">
                        {[
                            { icon: 'local_shipping', title: 'Fast Local Delivery', sub: 'Within 24–48 hours' },
                            { icon: 'verified_user', title: 'Secure Payments', sub: 'Cash & mobile money' },
                            { icon: 'workspace_premium', title: 'Quality Assured', sub: 'Hand-picked selections' },
                            { icon: 'support_agent', title: '24/7 Support', sub: 'Always here to help' },
                        ].map(({ icon, title, sub }) => (
                            <div key={title} className="flex items-center gap-4 py-6 px-6 lg:px-8 first:pl-0 last:pr-0">
                                <div className="shrink-0 size-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined !text-xl text-amber-600">{icon}</span>
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-black dark:text-white">{title}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SHOP BY CATEGORY ──────────────────────────────── */}
            <section className="py-20 bg-slate-50 dark:bg-slate-900/30">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                    {/* Section header */}
                    <div className="flex items-end justify-between mb-12">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="block h-px w-6 bg-amber-500" />
                                <span className="text-amber-600 text-xs font-black uppercase tracking-widest">Explore</span>
                            </div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter text-black dark:text-white">Shop by Category</h2>
                        </div>
                    </div>

                    {/* Asymmetric category grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        {/* Women — tall card */}
                        <Link href="/products?category=Women" className="relative group block overflow-hidden bg-black row-span-1 lg:row-span-1" style={{ aspectRatio: '3/4' }}>
                            <img
                                alt="Women's Collection"
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                src="https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=800&auto=format&fit=crop"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-7 flex flex-col gap-1">
                                <p className="text-white/60 text-xs font-bold tracking-widest uppercase">Collection</p>
                                <h3 className="font-black text-white text-2xl uppercase tracking-tight">Women</h3>
                                <div className="flex items-center gap-1 mt-3 text-amber-400 text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                    Shop Now <span className="material-symbols-outlined !text-sm">arrow_forward</span>
                                </div>
                            </div>
                        </Link>

                        <div className="flex flex-col gap-3 md:gap-4">
                            {/* Men */}
                            <Link href="/products?category=Men" className="relative group block overflow-hidden bg-black flex-1" style={{ aspectRatio: '4/3' }}>
                                <img
                                    alt="Men's Collection"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                    src="https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=800&auto=format&fit=crop"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col gap-1">
                                    <p className="text-white/60 text-xs font-bold tracking-widest uppercase">Collection</p>
                                    <h3 className="font-black text-white text-2xl uppercase tracking-tight">Men</h3>
                                    <div className="flex items-center gap-1 mt-2 text-amber-400 text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                        Shop Now <span className="material-symbols-outlined !text-sm">arrow_forward</span>
                                    </div>
                                </div>
                            </Link>
                            {/* Accessories */}
                            <Link href="/products?category=Accessories" className="relative group block overflow-hidden bg-black flex-1" style={{ aspectRatio: '4/3' }}>
                                <img
                                    alt="Accessories"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                    src="https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=800&auto=format&fit=crop"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col gap-1">
                                    <p className="text-white/60 text-xs font-bold tracking-widest uppercase">Collection</p>
                                    <h3 className="font-black text-white text-2xl uppercase tracking-tight">Accessories</h3>
                                    <div className="flex items-center gap-1 mt-2 text-amber-400 text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                        Shop Now <span className="material-symbols-outlined !text-sm">arrow_forward</span>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {/* CTA panel */}
                        <div className="bg-black p-8 flex flex-col justify-between" style={{ aspectRatio: '3/4' }}>
                            <div>
                                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Featured Drop</p>
                                <h3 className="text-3xl font-black text-white uppercase tracking-tight leading-tight">New<br />Season.<br />Bold<br />Moves.</h3>
                            </div>
                            <div className="space-y-4">
                                <p className="text-white/50 text-sm leading-relaxed">
                                    Fresh arrivals weekly from independent creators across Cyprus and beyond.
                                </p>
                                <Link
                                    href="/products"
                                    className="group inline-flex w-full items-center justify-between px-5 py-3.5 border border-white/20 text-white text-xs font-black uppercase tracking-widest hover:bg-amber-600 hover:border-amber-600 transition-all duration-300"
                                >
                                    Browse All
                                    <span className="material-symbols-outlined !text-base transition-transform group-hover:translate-x-1">arrow_forward</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TRENDING NOW ─────────────────────────────────── */}
            <section className="py-20 bg-white dark:bg-slate-950">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="flex items-end justify-between mb-12">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="block h-px w-6 bg-amber-500" />
                                <span className="text-amber-600 text-xs font-black uppercase tracking-widest">Right Now</span>
                            </div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter text-black dark:text-white">Trending</h2>
                        </div>
                        {displayTrending.length > 0 && (
                            <Link
                                className="group inline-flex items-center gap-1.5 text-black dark:text-white font-bold text-xs uppercase tracking-widest hover:text-amber-600 transition-colors"
                                href="/trending"
                            >
                                View All
                                <span className="material-symbols-outlined !text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
                            </Link>
                        )}
                    </div>

                    {displayTrending.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-slate-200 dark:border-slate-700 text-center">
                            <span className="material-symbols-outlined !text-5xl text-slate-300 dark:text-slate-700 mb-4">whatshot</span>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Fresh drops coming soon!</h3>
                            <p className="text-slate-500 max-w-sm text-sm mb-6">
                                We're curating the hottest items from our top vendors. Check back soon.
                            </p>
                            <Link href="/products" className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-xs hover:bg-amber-600 dark:hover:bg-amber-500 transition-colors">
                                Browse All Products
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            {displayTrending.map((product: any) => {
                                const name = product.name
                                const storeName = product.stores?.name ?? product.store ?? 'Trident'
                                const price = product.price
                                const originalPrice = product.original_price
                                const imageUrl = (product.images && product.images[0]) || product.img || ''
                                const badge = product.badge ?? (originalPrice && originalPrice > price ? 'Sale' : null)
                                const href = product.id ? `/products/${product.id}` : '/products'

                                return (
                                    <Link key={product.id} href={href} className="group block">
                                        <div className="relative aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-800">
                                            {imageUrl ? (
                                                <img alt={name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={imageUrl} />
                                            ) : (
                                                <div className="w-full h-full bg-slate-200 dark:bg-slate-700" />
                                            )}
                                            {badge && (
                                                <div className="absolute top-3 left-3">
                                                    <span className={`${badge === 'Sale' ? 'bg-red-600' : 'bg-black'} text-white text-[9px] font-black px-2.5 py-1 uppercase tracking-widest`}>
                                                        {badge}
                                                    </span>
                                                </div>
                                            )}
                                            {/* Quick action overlay */}
                                            <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-black/90 py-3 px-4 flex items-center justify-center">
                                                <span className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined !text-sm">shopping_bag</span>
                                                    Quick View
                                                </span>
                                            </div>
                                        </div>
                                        <div className="pt-3.5 space-y-0.5">
                                            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">{storeName}</p>
                                            <h3 className="font-bold text-sm text-black dark:text-white line-clamp-1">{name}</h3>
                                            <div className="flex items-center gap-2 text-sm pt-0.5">
                                                <p className="font-black text-amber-600">${price}</p>
                                                {originalPrice && originalPrice > price && (
                                                    <p className="text-slate-400 line-through text-xs">${originalPrice}</p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* ── EDITORIAL / TREND REPORT ─────────────────────── */}
            <section className="py-20 bg-black">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="flex items-end justify-between mb-12">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="block h-px w-6 bg-amber-500" />
                                <span className="text-amber-500 text-xs font-black uppercase tracking-widest">Editorial</span>
                            </div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter text-white">The Trend Report</h2>
                        </div>
                        <Link href="/trending" className="group inline-flex items-center gap-1.5 text-white/60 font-bold text-xs uppercase tracking-widest hover:text-amber-400 transition-colors">
                            All Lookbooks
                            <span className="material-symbols-outlined !text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { label: 'Suit Yourself', img: 'photo-1594938298603-c8148c4b4061', tag: 'Formal' },
                            { label: 'Spring Socials', img: 'photo-1515886657613-9f3515b0c78f', tag: 'Casual' },
                            { label: 'Utility Refresh', img: 'photo-1552374196-1ab2a1c593e8', tag: 'Streetwear' },
                        ].map(({ label, img, tag }) => (
                            <div key={label} className="relative group aspect-[3/4] overflow-hidden cursor-pointer">
                                <img
                                    alt={label}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    src={`https://images.unsplash.com/${img}?q=80&w=800&auto=format&fit=crop`}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                                {/* Tag */}
                                <div className="absolute top-5 left-5">
                                    <span className="text-[9px] text-white/70 font-black uppercase tracking-widest border border-white/30 px-2.5 py-1">
                                        {tag}
                                    </span>
                                </div>
                                {/* Label */}
                                <div className="absolute inset-x-0 bottom-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                    <h3 className="text-white font-black text-xl uppercase tracking-tight mb-3">{label}</h3>
                                    <Link href="/products" className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        Explore <span className="material-symbols-outlined !text-sm">arrow_forward</span>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── VENDOR CTA BANNER ────────────────────────────── */}
            <section className="relative overflow-hidden bg-amber-600 py-16">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
                </div>
                <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left">
                        <p className="text-amber-100/80 text-xs font-black uppercase tracking-widest mb-2">For Creators</p>
                        <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-tight">
                            Sell Your Brand<br />on Trident Store
                        </h2>
                        <p className="text-white/70 mt-3 max-w-md text-sm leading-relaxed">
                            Join 100+ independent designers. Your own storefront, your terms, zero upfront cost.
                        </p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <Link
                            href="/vendor-apply"
                            className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-all duration-300 shadow-xl"
                        >
                            Apply Now
                        </Link>
                        <Link
                            href="/vendor-apply#how-it-works"
                            className="px-8 py-4 border-2 border-white text-white font-black uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-all duration-300"
                        >
                            Learn More
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    )
}
