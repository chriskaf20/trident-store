"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/store";
import { CartDrawer } from "./CartDrawer";
import { FilterDrawer } from "./FilterDrawer";
import { createClient } from "@/lib/supabase/client";

export function Navbar() {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const cartCount = useCartStore((state) => state.cartCount());
    const supabase = createClient();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user);
            if (data.user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single()
                setUserProfile(profileData)
            } else {
                setUserProfile(null)
            }
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/products?query=${encodeURIComponent(searchQuery.trim())}`;
        }
    };

    return (
        <>
            <header className="sticky top-0 z-50 bg-white border-b border-slate-200 dark:bg-slate-950 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 sm:h-20 gap-4">

                        {/* Left: Logo & Desktop Nav */}
                        <div className="flex items-center gap-6 lg:gap-10 shrink-0">
                            <Link href="/" className="flex items-center group cursor-pointer">
                                <Image
                                    src="/logo.svg"
                                    alt="Trident Store"
                                    width={200}
                                    height={50}
                                    className="h-10 w-auto object-contain dark:[filter:invert(0.85)_brightness(1.5)]"
                                    priority
                                />
                            </Link>

                            <nav className="hidden lg:flex items-center gap-5">
                                <Link className="text-sm font-black text-black dark:text-white uppercase tracking-widest hover:text-amber-600 transition-colors" href="/products?category=Men">Men</Link>
                                <Link className="text-sm font-black text-black dark:text-white uppercase tracking-widest hover:text-amber-600 transition-colors" href="/products?category=Women">Women</Link>
                                <Link className="text-sm font-black text-black dark:text-white uppercase tracking-widest hover:text-amber-600 transition-colors" href="/products?category=Accessories">Accessories</Link>
                                <Link className="text-sm font-black text-black dark:text-white uppercase tracking-widest hover:text-amber-600 transition-colors" href="/trending">Trending</Link>
                                {userProfile?.role === 'admin' ? (
                                    <Link className="text-sm font-black text-black dark:text-white uppercase tracking-widest hover:text-amber-600 transition-colors" href="/admin/dashboard">Admin Dashboard</Link>
                                ) : userProfile?.role === 'vendor' ? (
                                    <Link className="text-sm font-black text-black dark:text-white uppercase tracking-widest hover:text-amber-600 transition-colors" href="/dashboard">Vendor Dashboard</Link>
                                ) : (
                                    <Link className="text-sm font-black text-black dark:text-white uppercase tracking-widest hover:text-amber-600 transition-colors" href="/vendor-apply">Become a Vendor</Link>
                                )}
                            </nav>
                        </div>

                        {/* Right: Search + Actions */}
                        <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-end">
                            {/* Search Bar */}
                            <form onSubmit={handleSearch} className="hidden lg:flex items-center border border-slate-200 dark:border-slate-700 px-3 py-2 focus-within:border-black dark:focus-within:border-white transition-all flex-1 max-w-xs">
                                <span className="material-symbols-outlined text-black dark:text-white !text-xl mr-2">search</span>
                                <input
                                    className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 outline-none text-black dark:text-white"
                                    placeholder="Search trends..."
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {/* Filter Button next to search */}
                                <button
                                    type="button"
                                    onClick={() => setIsFilterOpen(true)}
                                    className="ml-1 p-1 text-black dark:text-white hover:text-amber-600 transition-colors"
                                    title="Filters"
                                >
                                    <span className="material-symbols-outlined !text-[20px]">tune</span>
                                </button>
                            </form>

                            {/* Wishlist */}
                            <Link href="/wishlist" className="relative p-2.5 text-black dark:text-white hover:text-amber-600 transition-all" title="Wishlist">
                                <span className="material-symbols-outlined !text-[22px]">favorite</span>
                            </Link>

                            {/* Cart */}
                            <button onClick={() => setIsCartOpen(true)} className="relative p-2.5 text-black dark:text-white hover:text-amber-600 transition-all">
                                <span className="material-symbols-outlined !text-[22px]">shopping_bag</span>
                                {mounted && cartCount > 0 && <span className="absolute top-1.5 right-1.5 size-2 bg-red-600 rounded-full"></span>}
                            </button>

                            {/* Auth Actions */}
                            {user ? (
                                <div className="flex items-center gap-1">
                                    <Link href="/profile" className="p-2.5 text-black dark:text-white hover:text-amber-600 transition-all" title="Profile">
                                        <span className="material-symbols-outlined !text-[22px]">person</span>
                                    </Link>
                                    <button
                                        onClick={async () => {
                                            await supabase.auth.signOut();
                                            window.location.reload();
                                        }}
                                        className="p-2.5 text-black dark:text-white hover:text-red-600 transition-all"
                                        title="Sign Out"
                                    >
                                        <span className="material-symbols-outlined !text-[22px]">logout</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="hidden sm:flex items-center gap-2">
                                    <Link
                                        href="/auth/login"
                                        className="px-4 py-2 text-sm font-black uppercase tracking-widest text-black dark:text-white hover:text-amber-600 transition-colors"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/auth/signup"
                                        className="px-4 py-2 text-sm font-black uppercase tracking-widest bg-black dark:bg-white text-white dark:text-black hover:bg-amber-600 dark:hover:bg-amber-500 transition-colors"
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                            )}

                            {/* Mobile Menu Toggle */}
                            <button
                                className="lg:hidden p-2.5 text-black dark:text-white hover:text-amber-600"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                <span className="material-symbols-outlined !text-[24px]">{isMobileMenuOpen ? "close" : "menu"}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-1 animate-in slide-in-from-top-2">
                        {/* Mobile Search */}
                        <form onSubmit={handleSearch} className="flex items-center border border-slate-200 dark:border-slate-700 px-3 py-2 mb-3">
                            <span className="material-symbols-outlined text-black dark:text-white !text-xl mr-2">search</span>
                            <input
                                className="bg-transparent flex-1 text-sm outline-none text-black dark:text-white placeholder:text-slate-400"
                                placeholder="Search trends..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button type="button" onClick={() => setIsFilterOpen(true)} className="ml-1 text-black dark:text-white hover:text-amber-600">
                                <span className="material-symbols-outlined !text-[20px]">tune</span>
                            </button>
                        </form>
                        {[
                            { href: "/products?category=Men", label: "Men" },
                            { href: "/products?category=Women", label: "Women" },
                            { href: "/products?category=Accessories", label: "Accessories" },
                            { href: "/trending", label: "Trending" },
                            { 
                                href: userProfile?.role === 'admin' ? "/admin/dashboard" : userProfile?.role === 'vendor' ? "/dashboard" : "/vendor-apply", 
                                label: userProfile?.role === 'admin' ? "Admin Dashboard" : userProfile?.role === 'vendor' ? "Vendor Dashboard" : "Become a Vendor" 
                            },
                        ].map(({ href, label }) => (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block px-2 py-3 text-sm font-black uppercase tracking-widest text-black dark:text-white hover:text-amber-600 border-b border-slate-100 dark:border-slate-800 transition-colors"
                            >
                                {label}
                            </Link>
                        ))}
                        {!user && (
                            <div className="pt-3 flex gap-3">
                                <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)} className="flex-1 text-center py-3 border border-black dark:border-white text-sm font-black uppercase tracking-widest text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">Sign In</Link>
                                <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)} className="flex-1 text-center py-3 bg-black dark:bg-white text-white dark:text-black text-sm font-black uppercase tracking-widest hover:bg-amber-600 transition-colors">Sign Up</Link>
                            </div>
                        )}
                    </div>
                )}
            </header>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <FilterDrawer isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
        </>
    );
}
