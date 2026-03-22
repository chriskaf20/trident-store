import { Navbar } from "@/components/storefront/Navbar";
import {
  MarqueeTicker,
  HeroSection,
  CuratedCategories,
  TrendingArrivals,
  TrustAndFeatures,
} from "@/components/storefront/home/AnimatedSections";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

export default async function Home() {
  const supabase = await createClient();

  const { data: dbTrendingProducts } = await supabase
    .from("products")
    .select("*, stores(name)")
    .eq("is_trending", true)
    .limit(4);

  const trendingProducts = (dbTrendingProducts || []).map((product: any) => ({
    id: product.id,
    name: product.name,
    vendor: product.stores?.name || "Unknown Store",
    price: Number(product.price).toLocaleString("en-US") + " TL",
    rating: 4.8,
    image: product.image || "",
  }));

  const getCategoryCount = async (categoryName: string) => {
    try {
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("category", categoryName);
      return count || 0;
    } catch {
      return 0;
    }
  };

  const [womenCount, menCount, accessoriesCount] = await Promise.all([
    getCategoryCount("Women"),
    getCategoryCount("Men"),
    getCategoryCount("Accessories"),
  ]);

  const CATEGORIES = [
    {
      name: "Women's Collection",
      slug: "women",
      image:
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop",
      count: `${womenCount.toLocaleString("en-US")} items`,
    },
    {
      name: "Men's Collection",
      slug: "men",
      image:
        "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=800&auto=format&fit=crop",
      count: `${menCount.toLocaleString("en-US")} items`,
    },
    {
      name: "Accessories",
      slug: "accessories",
      image:
        "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=800&auto=format&fit=crop",
      count: `${accessoriesCount.toLocaleString("en-US")} items`,
    },
  ];

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground">
      <Navbar />
      <MarqueeTicker />
      <HeroSection />
      <CuratedCategories categories={CATEGORIES} />
      <TrendingArrivals products={trendingProducts} />

      {/* Vendor CTA Section */}
      <section className="px-6 md:px-12 py-24">
        <div className="max-w-5xl mx-auto rounded-3xl premium-card overflow-hidden">
          <div className="relative bg-foreground text-background p-12 md:p-24 text-center rounded-[1.4rem]">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-foreground/5 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-foreground/5 rounded-full blur-[80px]" />
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-background/50 text-xs font-semibold uppercase tracking-[0.2em] mb-4">
                For Creators
              </span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                Are you an independent creator?
              </h2>
              <p className="text-background/70 text-lg max-w-2xl mb-10">
                Join Trident Store and sell directly to thousands of fashion
                enthusiasts. Enjoy lower fees, better discovery, and direct
                customer interactions.
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

      <TrustAndFeatures />

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-6 md:px-12 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-1 flex flex-col gap-4">
              <span className="font-bold text-lg tracking-tight">Trident Store</span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Premium fashion marketplace connecting independent creators with
                style-conscious shoppers worldwide.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-2">
                Trusted by vendors globally.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-widest mb-5 text-muted-foreground">
                Shop
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/collections/women" className="text-muted-foreground hover:text-foreground transition-colors">
                    Women
                  </Link>
                </li>
                <li>
                  <Link href="/collections/men" className="text-muted-foreground hover:text-foreground transition-colors">
                    Men
                  </Link>
                </li>
                <li>
                  <Link href="/collections/accessories" className="text-muted-foreground hover:text-foreground transition-colors">
                    Accessories
                  </Link>
                </li>
                <li>
                  <Link href="/trending" className="text-muted-foreground hover:text-foreground transition-colors">
                    Trending Now
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-widest mb-5 text-muted-foreground">
                Sell
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/vendor-apply" className="text-muted-foreground hover:text-foreground transition-colors">
                    Become a Vendor
                  </Link>
                </li>
                <li>
                  <Link href="/stores" className="text-muted-foreground hover:text-foreground transition-colors">
                    Browse Stores
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-widest mb-5 text-muted-foreground">
                Account
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
                    My Profile
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className="text-muted-foreground hover:text-foreground transition-colors">
                    Cart
                  </Link>
                </li>
                <li>
                  <Link href="/wishlist" className="text-muted-foreground hover:text-foreground transition-colors">
                    Wishlist
                  </Link>
                </li>
                <li>
                  <Link href="/auth/login" className="text-muted-foreground hover:text-foreground transition-colors">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>&copy; 2026 Trident Store by Mosala. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="/newsletter" className="hover:text-foreground transition-colors">
                Newsletter
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}