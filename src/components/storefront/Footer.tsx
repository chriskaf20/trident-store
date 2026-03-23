"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

function NewsletterBar() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    // Simulate a brief delay for newsletter subscription
    await new Promise((r) => setTimeout(r, 800));
    setStatus("success");
    setEmail("");
  }

  return (
    <div className="bg-black py-12 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="text-center md:text-left">
          <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-1">
            Stay in the Loop
          </h3>
          <p className="text-white/50 text-sm max-w-xs">
            Exclusive drops, style updates & early access. Join 12k+ shoppers.
          </p>
        </div>

        {status === "success" ? (
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-6 py-4 w-full max-w-md">
            <span className="material-symbols-outlined text-green-400 !text-xl">
              check_circle
            </span>
            <p className="text-green-400 font-bold text-sm">
              You're in! Welcome to the inner circle.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex w-full max-w-md gap-0">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/30 !text-[18px]">
                mail
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="w-full pl-10 pr-4 py-3.5 bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm outline-none focus:border-white/60 transition-colors rounded-l-xl"
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-6 py-3.5 bg-amber-600 text-white font-black text-sm uppercase tracking-widest hover:bg-amber-500 transition-colors whitespace-nowrap rounded-r-xl disabled:opacity-60 flex items-center gap-2"
            >
              {status === "loading" ? (
                <span className="material-symbols-outlined !text-[18px] animate-spin">
                  progress_activity
                </span>
              ) : (
                "Subscribe"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
      {/* Newsletter Bar */}
      <NewsletterBar />

      {/* Main Footer Grid */}
      <div className="py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10">
          {/* Brand Column — spans 2 cols */}
          <div className="col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-2 group w-max">
              <Image
                src="/logo.svg"
                alt="Trident Store"
                width={150}
                height={38}
                className="h-9 w-auto object-contain dark:[filter:invert(0.85)_brightness(1.5)]"
              />
            </Link>
            <p className="max-w-xs leading-relaxed text-slate-500 dark:text-slate-400 text-sm">
              The premier multi-vendor fashion marketplace in Cyprus. Connecting
              local designers with discerning shoppers, one drop at a time.
            </p>

            {/* Payment Methods */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                We Accept
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                  <span className="material-symbols-outlined !text-[15px]">
                    payments
                  </span>{" "}
                  Cash on Delivery
                </span>
                <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                  <span className="material-symbols-outlined !text-[15px]">
                    phone_android
                  </span>{" "}
                  Mobile Money
                </span>
              </div>
            </div>

            {/* Social Icons */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Follow Us
              </p>
              <div className="flex gap-2">
                <a
                  href="#"
                  aria-label="Instagram"
                  className="size-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700"
                  title="Instagram"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="TikTok"
                  className="size-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-black hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700"
                  title="TikTok"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="WhatsApp"
                  className="size-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-green-500 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700"
                  title="WhatsApp"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="Facebook"
                  className="size-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700"
                  title="Facebook"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-5 text-xs uppercase tracking-widest">
              Shop
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/products?category=Women"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="material-symbols-outlined !text-[14px] opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">
                    chevron_right
                  </span>
                  Women's Collection
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=Men"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="material-symbols-outlined !text-[14px] opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">
                    chevron_right
                  </span>
                  Men's Collection
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=Accessories"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="material-symbols-outlined !text-[14px] opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">
                    chevron_right
                  </span>
                  Accessories
                </Link>
              </li>
              <li>
                <Link
                  href="/trending"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="material-symbols-outlined !text-[14px] opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">
                    chevron_right
                  </span>
                  Trending Now
                </Link>
              </li>
              <li>
                <Link
                  href="/products?sale=true"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="material-symbols-outlined !text-[14px] opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">
                    chevron_right
                  </span>
                  Sale & Offers
                </Link>
              </li>
              <li>
                <Link
                  href="/stores"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="material-symbols-outlined !text-[14px] opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">
                    chevron_right
                  </span>
                  Browse Stores
                </Link>
              </li>
            </ul>
          </div>

          {/* Vendors */}
          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-5 text-xs uppercase tracking-widest">
              Sell on Trident
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/vendor-apply"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="material-symbols-outlined !text-[14px] opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">
                    chevron_right
                  </span>
                  Become a Vendor
                </Link>
              </li>
              <li>
                <Link
                  href="/stores"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="material-symbols-outlined !text-[14px] opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">
                    chevron_right
                  </span>
                  Browse Stores
                </Link>
              </li>
              <li>
                <Link
                  href="/vendor-apply#how-it-works"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="material-symbols-outlined !text-[14px] opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">
                    chevron_right
                  </span>
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/vendor-apply#apply"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="material-symbols-outlined !text-[14px] opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">
                    chevron_right
                  </span>
                  Vendor Guidelines
                </Link>
              </li>
              <li>
                <Link
                  href="/vendor-apply#faq"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="material-symbols-outlined !text-[14px] opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">
                    chevron_right
                  </span>
                  Vendor FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-5 text-xs uppercase tracking-widest">
              Account
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/profile"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="material-symbols-outlined !text-[14px] opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">
                    chevron_right
                  </span>
                  My Account
                </Link>
              </li>
              <li>
                <Link
                  href="/profile/orders"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="material-symbols-outlined !text-[14px] opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">
                    chevron_right
                  </span>
                  Track My Order
                </Link>
              </li>
              <li>
                <Link
                  href="/wishlist"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="material-symbols-outlined !text-[14px] opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">
                    chevron_right
                  </span>
                  Wishlist
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/login"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="material-symbols-outlined !text-[14px] opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">
                    chevron_right
                  </span>
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/signup"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="material-symbols-outlined !text-[14px] opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">
                    chevron_right
                  </span>
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-5 text-xs uppercase tracking-widest">
              Help & Info
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/about"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="material-symbols-outlined !text-[14px] opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">
                    chevron_right
                  </span>
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="material-symbols-outlined !text-[14px] opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">
                    chevron_right
                  </span>
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="material-symbols-outlined !text-[14px] opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">
                    chevron_right
                  </span>
                  Return Center
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="material-symbols-outlined !text-[14px] opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">
                    chevron_right
                  </span>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="material-symbols-outlined !text-[14px] opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">
                    chevron_right
                  </span>
                  Careers
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Trust badges row */}
      <div className="border-t border-slate-100 dark:border-slate-800/60 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined !text-[16px] text-green-500">
              verified_user
            </span>
            Secure Checkout
          </span>
          <span className="text-slate-200 dark:text-slate-700">|</span>
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined !text-[16px] text-blue-500">
              local_shipping
            </span>
            Fast Local Delivery
          </span>
          <span className="text-slate-200 dark:text-slate-700">|</span>
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined !text-[16px] text-amber-500">
              support_agent
            </span>
            24/7 Support
          </span>
          <span className="text-slate-200 dark:text-slate-700">|</span>
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined !text-[16px] text-purple-500">
              workspace_premium
            </span>
            Quality Curated
          </span>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-200 dark:border-slate-800 py-6 px-4 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-400">
          <p>
            © {new Date().getFullYear()} Trident Store Marketplace. All rights
            reserved.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center">
            <Link href="/privacy" className="hover:text-amber-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-amber-600 transition-colors">
              Terms of Service
            </Link>
            <Link href="/cookie" className="hover:text-amber-600 transition-colors">
              Cookie Settings
            </Link>
            <Link href="/sitemap" className="hover:text-amber-600 transition-colors">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
