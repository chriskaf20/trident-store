"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Star, Zap, TrendingUp, ShoppingBag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/store";

export function HeroSection() {
    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 md:px-12 overflow-hidden flex flex-col items-center text-center">
            {/* Abstract Background Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse-slow" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[80px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[80px] -z-10" />

            <motion.h1
                initial={{ opacity: 1, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter max-w-5xl leading-[1.1] mb-6 text-foreground"
            >
                Elevate your style with <span className="text-gradient">global creators.</span>
            </motion.h1>

            <motion.p
                initial={{ opacity: 1, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10"
            >
                Discover unique fashion pieces from independent designers directly. Shop securely, support global talent, and stand out.
            </motion.p>

            <motion.div
                initial={{ opacity: 1, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
                {/* FIX: Replaced dead button with functional link to categories anchor */}
                <Link href="#categories" className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto px-8 py-4 bg-foreground text-background rounded-full font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all hover:gap-4 group">
                        Shop the Collection <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                </Link>
                <Link href="/vendor-apply" className="w-full sm:w-auto">
                    <button className="w-full px-8 py-4 glass-panel text-foreground rounded-full font-medium flex items-center justify-center hover:bg-secondary transition-colors">
                        Become a Vendor
                    </button>
                </Link>
            </motion.div>

            {/* Feature Highlights */}
            <motion.div
                initial={{ opacity: 1, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 mt-24 text-left border-t border-border/50 pt-12 w-full max-w-5xl"
            >
                <div className="flex flex-col gap-2">
                    <Zap className="w-6 h-6 text-muted-foreground mb-2" />
                    <h3 className="font-semibold text-lg text-foreground">Fast Delivery</h3>
                    <p className="text-sm text-muted-foreground">Select local creators for lightning-fast order fulfillment directly to your door.</p>
                </div>
                <div className="flex flex-col gap-2">
                    <ShieldCheck className="w-6 h-6 text-muted-foreground mb-2" />
                    <h3 className="font-semibold text-lg text-foreground">Secure Payments</h3>
                    <p className="text-sm text-muted-foreground">Multiple checkout options including cash on delivery and mobile money.</p>
                </div>
                <div className="flex flex-col gap-2">
                    <Star className="w-6 h-6 text-muted-foreground mb-2" />
                    <h3 className="font-semibold text-lg text-foreground">Premium Quality</h3>
                    <p className="text-sm text-muted-foreground">Every vendor is vetted to ensure you only get the highest quality fashion pieces.</p>
                </div>
            </motion.div>
        </section>
    );
}

export function CuratedCategories({ categories }: { categories: any[] }) {
    return (
        <section id="categories" className="px-6 md:px-12 py-24 bg-secondary/30">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-end justify-between mb-12">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Curated Categories</h2>
                        <p className="text-muted-foreground">Explore our most popular departments.</p>
                    </div>
                    <Link href="/categories" className="hidden sm:flex items-center gap-2 text-sm font-medium hover:text-muted-foreground transition-colors group">
                        View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {categories.map((category, idx) => (
                        <motion.div
                            initial={{ opacity: 1, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            key={category.name}
                            className="group relative h-[400px] rounded-2xl overflow-hidden cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500 z-10" />
                            <Image
                                src={category.image}
                                alt={category.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute bottom-0 left-0 p-8 z-20">
                                <h3 className="text-2xl font-bold text-white mb-1">{category.name}</h3>
                                <p className="text-white/80 text-sm font-medium">{category.count}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function TrendingArrivals({ products }: { products: any[] }) {
    const addItem = useCartStore(state => state.addItem);

    const handleAddToCart = (product: any) => {
        // Parse numeric price from "4,500 TL"
        const priceNumeric = parseInt(product.price.replace(/[^\d]/g, ''), 10) || 0;

        addItem({
            id: `prod_${product.id}`,
            name: product.name,
            price: priceNumeric,
            quantity: 1,
            image: product.image,
            vendorId: product.store_id || product.vendorId || '',
            vendorName: product.vendor
        });
    };

    return (
        <section className="px-6 md:px-12 py-24 max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-2 text-primary/80">
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold tracking-wider text-sm uppercase">Now Trending</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12">Latest Arrivals</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {products.map((product, idx) => (
                    <motion.div
                        initial={{ opacity: 1, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        key={product.id}
                        className="group flex flex-col gap-4"
                    >
                        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-secondary">
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/90 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                <span className="text-xs font-bold">{product.rating}</span>
                            </div>
                            {/* Overlay Add to cart FIX: Added onClick to dead button */}
                            <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                <button
                                    onClick={() => handleAddToCart(product)}
                                    className="w-full py-3 bg-foreground text-background font-medium rounded-lg text-sm shadow-xl flex items-center justify-center gap-2"
                                >
                                    <ShoppingBag className="w-4 h-4" /> Add to Cart
                                </button>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-foreground line-clamp-1">{product.name}</h3>
                                <span className="font-semibold">{product.price}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{product.vendor}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
