import { Navbar } from "@/components/storefront/Navbar";
import { HeroSection, CuratedCategories, TrendingArrivals } from "@/components/storefront/home/AnimatedSections";
import Link from "next/link";

const CATEGORIES = [
  { name: "Women's Collection", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop", count: "1,240 items" },
  { name: "Men's Collection", image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=800&auto=format&fit=crop", count: "890 items" },
  { name: "Accessories", image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=800&auto=format&fit=crop", count: "3,100 items" },
];

const TRENDING_PRODUCTS = [
  { id: 1, name: "Midnight Silk Dress", vendor: "Elegance Boutique", price: "4,500 TL", rating: 4.9, image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=600&auto=format&fit=crop" },
  { id: 2, name: "Urban Leather Jacket", vendor: "Streetwear Hub", price: "12,000 TL", rating: 4.8, image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop" },
  { id: 3, name: "Classic Chronograph", vendor: "Timepiece Co.", price: "8,900 TL", rating: 5.0, image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=600&auto=format&fit=crop" },
  { id: 4, name: "Minimalist Sneakers", vendor: "Kicks Factory", price: "5,200 TL", rating: 4.7, image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=600&auto=format&fit=crop" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground">
      <Navbar />

      <HeroSection />

      <CuratedCategories categories={CATEGORIES} />

      <TrendingArrivals products={TRENDING_PRODUCTS} />

      {/* CTA Section */}
      <section className="px-6 md:px-12 py-24 mb-12">
        <div className="max-w-5xl mx-auto rounded-3xl premium-card overflow-hidden">
          <div className="relative bg-foreground text-background p-12 md:p-24 text-center rounded-[1.4rem]">
            {/* Dark background graphic */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-foreground/5 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-foreground/5 rounded-full blur-[80px]" />

            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Are you an independent creator?</h2>
              <p className="text-background/80 text-lg max-w-2xl mb-10">
                Join Trident Store and sell directly to thousands of fashion enthusiasts. Enjoy lower fees, better discovery, and direct customer interactions.
              </p>
              <Link href="/vendor-apply">
                <button className="px-8 py-4 bg-background text-foreground rounded-full font-bold shadow-2xl hover:scale-105 transition-transform">
                  Start Selling Today
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="border-t border-border/50 py-12 px-6 md:px-12 text-center text-muted-foreground text-sm">
        <p>© 2026 Trident Store by Mosala. All rights reserved.</p>
      </footer>
    </div>
  );
}
