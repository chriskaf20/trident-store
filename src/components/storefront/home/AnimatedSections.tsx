"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Star, Zap, TrendingUp, ShoppingBag, Lock, RotateCcw, Award, HeartHandshake, Truck, LayoutGrid } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/store";

export function MarqueeTicker() {
  const items = [
    "Free shipping on orders over 500 TL",
    "New vendors joining daily",
    "Secure & encrypted checkout",
    "Cash on delivery available",
    "Independent creators worldwide",
    "Premium quality guaranteed",
    "30-day easy returns",
    "Support local fashion talent",
  ];

  return (
    <div className="py-3 bg-foreground text-background overflow-hidden relative z-40 border-b border-border/10">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...items, ...items, ...items].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3 mx-8 text-xs font-semibold tracking-widest uppercase">
            <span className="w-1 h-1 rounded-full bg-background/40 shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-[88vh] flex flex-col items-center justify-center text-center px-6 md:px-12 overflow-hidden">
      {/* Background fashion collage */}
      <div className="absolute inset-0 -z-20">
        <div className="absolute inset-0 grid grid-cols-3 gap-0 opacity-[0.06]">
          {[
            "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=400&auto=format&fit=crop",
          ].map((src, i) => (
            <div key={i} className="relative overflow-hidden">
              <Image src={src} alt="" fill className="object-cover" sizes="33vw" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background/90" />
      </div>

      {/* Ambient blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/4 rounded-full blur-[120px] -z-10 animate-pulse-slow" />
      <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-indigo-500/8 rounded-full blur-[80px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-500/8 rounded-full blur-[80px] -z-10" />

      {/* Live badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border/60 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-8"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        New arrivals every week
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter max-w-5xl leading-[1.1] mb-6 text-foreground"
      >
        Elevate your style with{" "}
        <span className="text-gradient">global creators.</span>
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10"
      >
        Discover unique fashion pieces from independent designers directly.
        Shop securely, support global talent, and stand out.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-10"
      >
        <Link href="#categories" className="w-full sm:w-auto">
          <button className="w-full sm:w-auto px-8 py-4 bg-foreground text-background rounded-full font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all group">
            Shop the Collection
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </Link>
        <Link href="/vendor-apply" className="w-full sm:w-auto">
          <button className="w-full px-8 py-4 glass-panel text-foreground rounded-full font-medium flex items-center justify-center hover:bg-secondary transition-colors">
            Become a Vendor
          </button>
        </Link>
      </motion.div>

      {/* Social proof */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-3 text-sm text-muted-foreground"
      >
        <div className="flex -space-x-2">
          {[
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face",
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=40&h=40&fit=crop&crop=face",
            "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=40&h=40&fit=crop&crop=face",
          ].map((src, i) => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-background overflow-hidden relative">
              <Image src={src} alt="Customer" fill className="object-cover" sizes="32px" />
            </div>
          ))}
        </div>
        <span>
          Trusted by <strong className="text-foreground">independent creators</strong> worldwide
        </span>
      </motion.div>
    </section>
  );
}

export function CuratedCategories({ categories }: {
  categories: { name: string; slug: string; image: string; count: string }[]
}) {
  return (
    <section id="categories" className="px-6 md:px-12 py-16 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Curated Categories
            </h2>
            <p className="text-muted-foreground">Explore our most popular departments.</p>
          </div>
          <Link
            href="/products"
            className="hidden sm:flex items-center gap-2 text-sm font-medium hover:text-muted-foreground transition-colors group"
          >
            View all{" "}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              key={category.name}
            >
              <Link href={`/products?category=${category.slug}`}>
                <div className="group relative h-[280px] rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-shadow duration-500">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors duration-500 z-10" />
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 p-8 z-20">
                    <h3 className="text-2xl font-bold text-white mb-1">{category.name}</h3>
                    {category.count !== "0 items" && (
                      <p className="text-white/75 text-sm font-medium">{category.count}</p>
                    )}
                  </div>
                  <div className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProductGrid({
  title,
  subtitle,
  variant = "latest",
  products
}: {
  title: string;
  subtitle?: string;
  variant?: "latest" | "trending";
  products: any[]
}) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (product: any) => {
    const priceNumeric = parseInt(product.price.replace(/[^\d]/g, ""), 10) || 0;
    addItem({
      id: `prod_${product.id}`,
      name: product.name,
      price: priceNumeric,
      quantity: 1,
      image: product.image,
      vendorId: product.store_id || product.vendorId || "",
      vendorName: product.vendor,
    });
  };

  if (products.length === 0) return null;

  return (
    <section className="px-6 md:px-12 py-16 max-w-7xl mx-auto">
      {subtitle && (
        <div className="flex items-center gap-2 mb-2 text-primary/80">
          {variant === "trending" ? (
            <TrendingUp className="w-5 h-5" />
          ) : (
            <LayoutGrid className="w-5 h-5" />
          )}
          <span className="font-semibold tracking-wider text-sm uppercase">{subtitle}</span>
        </div>
      )}
      <div className="flex items-end justify-between mb-8">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h2>
        <Link
          href="/products"
          className="hidden sm:flex items-center gap-2 text-sm font-medium hover:text-muted-foreground transition-colors group"
        >
          See all{" "}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map((product, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            key={product.id}
            className="group flex flex-col gap-4"
          >
            <Link href={`/products/${product.id}`}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-secondary cursor-pointer">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-secondary" />
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 shadow-sm z-10">
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  <span className="text-xs font-bold text-black">{product.rating}</span>
                </div>
                <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddToCart(product);
                    }}
                    className="w-full py-3 bg-foreground text-background font-medium rounded-lg text-sm shadow-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <ShoppingBag className="w-4 h-4" /> Add to Cart
                  </button>
                </div>
              </div>
            </Link>
            <div>
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-foreground line-clamp-1">{product.name}</h3>
                <span className="font-semibold text-sm shrink-0 ml-2">{product.price}</span>
              </div>
              <p className="text-sm text-muted-foreground">{product.vendor}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function TrustAndFeatures() {
  return (
    <section className="px-6 md:px-12 py-20 bg-secondary/20 border-t border-border/40">
      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
            Why shop with Trident?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            We built Trident Store to make fashion discovery safe, easy, and meaningful.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="flex items-start gap-4 p-6 rounded-2xl bg-background border border-border/40 hover:border-border/80 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-foreground mb-1">Fast Delivery</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Select local creators for lightning-fast order fulfillment directly to your door.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-6 rounded-2xl bg-background border border-border/40 hover:border-border/80 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-foreground mb-1">Secure Payments</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Multiple checkout options including cash on delivery and mobile money.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-6 rounded-2xl bg-background border border-border/40 hover:border-border/80 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-foreground mb-1">Premium Quality</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every vendor is vetted to ensure you only get the highest quality fashion pieces.
              </p>
            </div>
          </div>
        </div>

        {/* Trust badges strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-background border border-border/30">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-xs text-foreground">Secure Checkout</p>
              <p className="text-xs text-muted-foreground">SSL encrypted</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-background border border-border/30">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-xs text-foreground">Easy Returns</p>
              <p className="text-xs text-muted-foreground">30-day policy</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-background border border-border/30">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <p className="font-semibold text-xs text-foreground">Vetted Vendors</p>
              <p className="text-xs text-muted-foreground">Quality guaranteed</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-background border border-border/30">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <p className="font-semibold text-xs text-foreground">Cash on Delivery</p>
              <p className="text-xs text-muted-foreground">Pay at your door</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}