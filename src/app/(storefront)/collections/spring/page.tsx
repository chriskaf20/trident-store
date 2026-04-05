import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Clock, Search, ShoppingBag, Star, TrendingUp } from "lucide-react";

export const metadata = {
    title: "Spring Collection | Trident Store"
};

export default function SpringCollectionPage() {
    return (
        <div className="flex-1 w-full bg-background">
            {/* Top Promo Bar */}
            <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-xs sm:text-sm font-medium flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4" />
                SPRING SALE: Up to 50% Off Selected Lines. Free shipping on orders over 150 TL.
                <Link href="#" className="underline font-bold ml-2">Shop Sale</Link>
            </div>

            {/* Secondary Navigation (Desktop) */}
            <div className="hidden md:block border-b border-border/40 bg-background/95 backdrop-blur-md sticky top-20 z-30">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <nav className="flex items-center justify-center gap-8 py-3 text-sm font-medium">
                        <Link href="#" className="text-primary font-bold">New In</Link>
                        <Link href="#" className="text-muted-foreground hover:text-foreground">Clothing</Link>
                        <Link href="#" className="text-muted-foreground hover:text-foreground">Shoes</Link>
                        <Link href="#" className="text-muted-foreground hover:text-foreground">Bags</Link>
                        <Link href="#" className="text-muted-foreground hover:text-foreground">Accessories</Link>
                        <Link href="#" className="text-red-500 hover:text-red-600 font-bold">Sale</Link>
                    </nav>
                </div>
            </div>

            {/* Hero Slider */}
            <section className="relative h-[60vh] sm:h-[70vh] min-h-[500px] w-full group overflow-hidden">
                <div className="absolute inset-0 bg-neutral-900 z-0">
                    <img
                        alt="Spring Summer Fashion Collection Campaign"
                        className="w-full h-full object-cover opacity-80 mix-blend-overlay transition-transform duration-1000 group-hover:scale-105"
                        src="https://lh3.googleusercontent.com/aida-public/AExO-B6ZJbHqEtwC19G6OqW9y76P8jWJvX21Q1yq9Otwb08v0L_181I18TfA2kIq1DZw7N56pCjZJ6kFk8mXZ4H-rY8k1U9k0sF95Z3xY73vIe1r56mKTwk1J274h7A9qK3D4Yp_A5h_2VpH7uL9kR9a"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 via-transparent to-transparent"></div>
                </div>
                {/* Navigation Arrows */}
                <button className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-background/20 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-primary transition-all duration-300">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-background/20 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-primary transition-all duration-300">
                    <ChevronRight className="w-6 h-6" />
                </button>

                <div className="relative z-10 w-full h-full flex items-center max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="max-w-xl animate-fade-up">
                        <span className="inline-block py-1 px-3 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold tracking-widest uppercase mb-4 rounded-full">
                            Season Premiere
                        </span>
                        <h1 className="text-5xl sm:text-7xl font-sans font-light text-white mb-4 tracking-tighter leading-tight drop-shadow-lg">
                            Spring/Summer <span className="font-bold italic">'24</span>
                        </h1>
                        <p className="text-lg text-neutral-200 mb-8 max-w-md drop-shadow-md">
                            Embrace the new season with lightweight fabrics, bold silhouettes, and vibrant colors.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button className="bg-white text-neutral-950 px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all duration-300 rounded shadow-xl">
                                Shop Collection
                            </button>
                        </div>
                    </div>
                </div>
                {/* Indicators */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                    <span className="block w-8 h-1 bg-white rounded-full"></span>
                    <span className="block w-2 h-1 bg-white/50 rounded-full cursor-pointer hover:bg-white/80 transition-colors"></span>
                    <span className="block w-2 h-1 bg-white/50 rounded-full cursor-pointer hover:bg-white/80 transition-colors"></span>
                </div>
            </section>

            {/* Category Navigation (Circles) */}
            <section className="py-12 border-b border-border/40 bg-background overflow-hidden relative">
                {/* Subtle background decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between overflow-x-auto hide-scrollbar gap-6 pb-4 md:pb-0">
                        {/* Category item */}
                        <Link href="#" className="flex flex-col items-center gap-3 min-w-[80px] group">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-colors p-[2px]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-neutral-100">
                                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQqA8QvB27O0XoE6zL7x9H0HlF6xZ9L8ZqR1x3Kx1q9K_4u0y1ZJ2A_6R8x2k1J5tO7A2H4Oq4x6N3M0yQ5R0B9b7Q0b0Y9s2q4L7x0pA0K8X6H2Y0G5O9p6O1X2K3D1xH5Z4L_A0V3I7Y4T0J2B7M9R8" alt="Dresses" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                            </div>
                            <span className="text-sm font-medium group-hover:text-primary transition-colors">Dresses</span>
                        </Link>
                        {/* Category item */}
                        <Link href="#" className="flex flex-col items-center gap-3 min-w-[80px] group">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-colors p-[2px]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-neutral-100">
                                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3M9I0T5A2lJ8oG6wN7x1R0CpH6yZ9K8XqR1x3Btw9K_1uO7ZJ2A_6T5x4l8J3N7A0V2P5Lq1X6N3M4kP5R0B9e9Q2b0Y1s2q4L7x0pA0K8X6O2T0E5C9p6D3H2H5Z4M_A2L4I7E9C0R2B4L2R8" alt="Tops" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                            </div>
                            <span className="text-sm font-medium group-hover:text-primary transition-colors">Tops</span>
                        </Link>
                        {/* Category item */}
                        <Link href="#" className="flex flex-col items-center gap-3 min-w-[80px] group">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-colors p-[2px]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-neutral-100">
                                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1P0Y9O8J2A6cI4zL9mN2K7XwE5tD8H3QvF0pA4M1bE3rW8YtC6kX9U2nS5mG1T4O7yD2P0M1kL8cI2Y9mN4E3H7X5tD8A4Q2vF0pK1bE3rW8T9C6kXwU2nS5mG1Y4O7yP2M1kL8cE3H7X5tD" alt="Outerwear" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                            </div>
                            <span className="text-sm font-medium group-hover:text-primary transition-colors">Outerwear</span>
                        </Link>
                        {/* Category item */}
                        <Link href="#" className="flex flex-col items-center gap-3 min-w-[80px] group">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-colors p-[2px]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-neutral-100">
                                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9R4xW7zM2sK5yE6tN1xL8J3PqO9eD5R1kU0X3Ctw4K_5uA7V2B_8T5x4l6J3N7A0V2P5Lq1X6N3M9R5T0I9e9Q2b0Y1s2q4V7x0lC0K8X6H2Y0G5M9p6U3K2P5F4M_A2Q4I7E9C0T2L4R8" alt="Accessories" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                            </div>
                            <span className="text-sm font-medium group-hover:text-primary transition-colors">Accessories</span>
                        </Link>
                        {/* Category item */}
                        <Link href="#" className="flex flex-col items-center gap-3 min-w-[80px] group">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-colors p-[2px]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-neutral-100">
                                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuE9N8xC4qK2lJ5pF6sH1yR0M7DpH6zG8F3O1x3Vtw9K_1uK1Z2A_6D5x4h2J3N7A0V2P5Lq1X6N3M4jP5V0B9e9Q2b0Y1s2q4H7x0lK0K8X6O2I0E5C9p6D3H2H5Z4L_A2M4I7E9C0S2P4R8" alt="Shoes" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                            </div>
                            <span className="text-sm font-medium group-hover:text-primary transition-colors">Shoes</span>
                        </Link>
                        {/* Category item */}
                        <Link href="#" className="flex flex-col items-center gap-3 min-w-[80px] group">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-colors p-[2px]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center bg-secondary text-secondary-foreground font-bold text-xs uppercase text-center relative">
                                    <span className="relative z-10 w-full">Shop<br />All</span>
                                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                            </div>
                            <span className="text-sm font-medium group-hover:text-primary transition-colors">View All</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Flash Sale Section */}
            <section className="py-16 bg-neutral-50 dark:bg-background-dark/30">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center animate-pulse">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <h2 className="text-3xl font-bold tracking-tight">Flash Sale</h2>
                            </div>
                            <p className="text-muted-foreground">Grab these amazing deals before they're gone.</p>
                        </div>
                        <div className="flex items-center gap-4 bg-white dark:bg-neutral-900 px-6 py-3 rounded-xl border border-border shadow-sm">
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Ends in:
                            </p>
                            <div className="flex items-center gap-2 font-mono text-xl font-bold">
                                <div className="flex flex-col items-center">
                                    <span className="text-primary">12</span>
                                </div>
                                <span>:</span>
                                <div className="flex flex-col items-center">
                                    <span>45</span>
                                </div>
                                <span>:</span>
                                <div className="flex flex-col items-center">
                                    <span>30</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Sale Product Card */}
                        <div className="group premium-card flex flex-col bg-background">
                            <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQqA8QvB27O0XoE6zL7x9H0HlF6xZ9L8ZqR1x3Kx1q9K_4u0y1ZJ2A_6R8x2k1J5tO7A2H4Oq4x6N3M0yQ5R0B9b7Q0b0Y9s2q4L7x0pA0K8X6H2Y0G5O9p6O1X2K3D1xH5Z4L_A0V3I7Y4T0J2B7M9R8" alt="Sale Item" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute top-3 left-3 flex flex-col gap-2">
                                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">-40% OFF</span>
                                </div>
                                {/* Quick Shop Overlay */}
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                    <button className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 shadow-lg">
                                        <ShoppingBag className="w-5 h-5" />
                                    </button>
                                    <button className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 shadow-lg delay-75">
                                        <Search className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 flex flex-col flex-grow">
                                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Studio Luxe</p>
                                <h3 className="font-semibold text-lg hover:text-primary transition-colors mb-2 line-clamp-1">Pleated Midi Dress</h3>
                                <div className="mt-auto flex items-center gap-3">
                                    <p className="text-red-500 font-bold text-xl">89.00 TL</p>
                                    <p className="text-muted-foreground text-sm line-through decoration-muted-foreground/50">149.00 TL</p>
                                </div>
                            </div>
                        </div>

                        {/* Repeat for other sale products as needed, using static placeholder for UI completeness */}
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="group premium-card flex flex-col bg-background">
                                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-secondary">
                                    {/* Dummy Image for variation */}
                                    <div className="w-full h-full bg-gradient-to-tr from-secondary to-muted opacity-50 flex items-center justify-center">
                                        <span className="material-symbols-outlined !text-4xl text-muted-foreground">image</span>
                                    </div>
                                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">-30% OFF</span>
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center translate-y-4 group-hover:translate-y-0 duration-300">
                                        <button className="bg-white text-black font-semibold text-sm w-full py-3 rounded-lg hover:bg-primary hover:text-white transition-colors">
                                            Quick Add
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 flex flex-col flex-grow">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Brand {item}</p>
                                    <h3 className="font-semibold text-lg hover:text-primary transition-colors mb-2 line-clamp-1">Sample Product {item}</h3>
                                    <div className="mt-auto flex items-center gap-3">
                                        <p className="text-red-500 font-bold text-xl">59.00 TL</p>
                                        <p className="text-muted-foreground text-sm line-through decoration-muted-foreground/50">85.00 TL</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trending Now */}
            <section className="py-20 bg-background">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-sans font-light mb-4">Trending Currently</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">Discover what's hot right now. Constantly updated based on community favorites.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
                        {/* Static Trending Products */}
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="group relative">
                                <div className="absolute -inset-2 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10 blur-xl"></div>
                                <div className="relative h-96 w-full overflow-hidden rounded-2xl bg-secondary transition-all">
                                    <div className="w-full h-full bg-gradient-to-br from-secondary to-muted opacity-80 flex items-center justify-center">
                                        <span className="material-symbols-outlined !text-4xl text-muted-foreground">apparel</span>
                                    </div>
                                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="mt-6">
                                    <p className="text-sm text-muted-foreground">Trending Item</p>
                                    <h3 className="text-lg font-medium text-foreground mt-1">Trendy Top {item}</h3>
                                    <p className="mt-2 text-primary font-bold text-lg">45.00 TL</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
