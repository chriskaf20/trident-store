import { Navbar } from "@/components/storefront/Navbar";
import { Footer } from "@/components/storefront/Footer";
import {
  MarqueeTicker,
  HeroSection,
  CuratedCategories,
  ProductGrid,
  TrustAndFeatures,
} from "@/components/storefront/home/AnimatedSections";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

export default async function Home() {
  const supabase = await createClient();

  // Use products_with_stores view to avoid N+1 queries
  const [
    { data: dbTrendingProducts },
    { data: dbLatestProducts }
  ] = await Promise.all([
    supabase.from("products_with_stores").select("*").eq("is_trending", true).limit(4),
    supabase.from("products_with_stores").select("*").order("created_at", { ascending: false }).limit(8)
  ]);

  const mapProduct = (product: any) => ({
    id: product.id,
    name: product.name,
    vendor: product.store_name || "Unknown Store",
    price: Number(product.price).toLocaleString("en-US") + " TL",
    rating: product.rating || 0,
    image: product.image || "",
  });

  const trendingProducts = (dbTrendingProducts || []).map(mapProduct);
  const latestProducts = (dbLatestProducts || []).map(mapProduct);

  const { data: categoryCounts } = await supabase.rpc('get_category_counts');
  
  const getCount = (catName: string) => {
    const item = (categoryCounts || []).find((c: any) => c.category === catName);
    return item ? Number(item.count) : 0;
  };

  const womenCount = getCount("Women");
  const menCount = getCount("Men");
  const accessoriesCount = getCount("Accessories");

  const CATEGORIES = [
    {
      name: "Women's Collection",
      slug: "Women",
      image:
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop",
      count: `${womenCount.toLocaleString("en-US")} items`,
    },
    {
      name: "Men's Collection",
      slug: "Men",
      image:
        "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=800&auto=format&fit=crop",
      count: `${menCount.toLocaleString("en-US")} items`,
    },
    {
      name: "Accessories",
      slug: "Accessories",
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

      <ProductGrid
        title="Discover All Products"
        subtitle="Fresh Drops"
        variant="latest"
        products={latestProducts}
      />

      {trendingProducts.length > 0 && (
        <ProductGrid
          title="Trending Now"
          subtitle="Popular Picks"
          variant="trending"
          products={trendingProducts}
        />
      )}

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
      <Footer />
    </div>
  );
}