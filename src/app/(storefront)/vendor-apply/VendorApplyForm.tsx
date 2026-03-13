"use client";

import { useActionState, useState } from "react";
import { applyVendor } from "./actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Input } from "@/components/ui/Input";
import {
  CheckCircle2,
  TrendingUp,
  Globe,
  Truck,
  Megaphone,
  ArrowRight,
  Star,
  ChevronDown,
  ShieldCheck,
  Zap,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

const faqs = [
  {
    q: "How long does the approval process take?",
    a: "Our curation team reviews every application within 24–48 hours. We believe in quality over quantity, so we look carefully at each brand.",
  },
  {
    q: "Is there a cost to join?",
    a: "Joining TRIDENT is completely free. We provide you with a dedicated storefront, marketing exposure, logistics coordination, and a powerful dashboard to manage your products and orders. In return, we take a small, transparent commission only on completed sales — so we only succeed when you do.",
  },
  {
    q: "What type of products can I sell?",
    a: "We specialize in fashion and lifestyle — clothing, footwear, accessories, and handmade/designer pieces are all welcome.",
  },
  {
    q: "Do I need to have a physical store?",
    a: "Not at all. Home-based designers, ateliers, and established boutiques are all welcome on TRIDENT.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
      >
        <span className="font-bold text-slate-900 dark:text-white text-base">
          {q}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-6 text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
          {a}
        </div>
      )}
    </div>
  );
}

export function VendorApplyForm() {
  const [state, formAction] = useActionState(applyVendor, null);

  if (state?.success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen py-32 px-6 bg-background">
        <div className="text-center max-w-lg">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-8 mx-auto shadow-xl shadow-green-500/10 border-4 border-white dark:border-slate-900">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="inline-block bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase mb-4">
            You're in the queue
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-slate-900 dark:text-white">
            Application Received!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg leading-relaxed">
            Welcome to the revolution. Our team is reviewing your brand profile
            and will be in touch within{" "}
            <strong className="text-slate-700 dark:text-slate-200">
              24–48 hours
            </strong>
            .
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 font-bold rounded-xl shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity uppercase tracking-widest text-sm"
          >
            Back to Store <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-background selection:bg-primary selection:text-white">
      {/* ─── HERO ─── */}
      <section className="relative w-full pt-32 pb-24 md:pt-44 md:pb-36 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            alt="Fashion designer at work"
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=2000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase mb-8 border border-white/20">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Now Accepting Applications
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tighter max-w-3xl mb-6">
            SELL YOUR FASHION
            <br />
            <span className="text-primary italic">BRAND</span> ACROSS
            <br />
            CYPRUS & BEYOND
          </h1>
          <p className="text-xl text-white/70 max-w-xl mb-10 leading-relaxed font-medium">
            Join the fastest-growing fashion marketplace in Cyprus. Zero upfront
            costs. Dedicated support. Real growth.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#apply"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white font-black rounded-xl hover:opacity-90 transition-all shadow-2xl shadow-primary/30 text-base uppercase tracking-widest"
            >
              Apply Now — It's Free <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold rounded-xl hover:bg-white/20 transition-all border border-white/20 text-base"
            >
              How It Works
            </a>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-white/10 max-w-2xl">
            {[
              { value: "50+", label: "Active Brands" },
              { value: "12k+", label: "Monthly Shoppers" },
              { value: "15", label: "Cities Covered" },
              { value: "0%", label: "Listing Fees" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl lg:text-4xl font-black text-white tracking-tighter mb-1">
                  {stat.value}
                </p>
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF STRIP ─── */}
      <section className="py-6 bg-primary/5 border-y border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-center gap-8 text-sm font-bold text-slate-500 uppercase tracking-widest">
          {[
            "Free to join",
            "no hidden fees",
            "dedicated onboarding",
            "24h approval",
            "real analytics",
          ].map((item) => (
            <span key={item} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ─── WHY TRIDENT ─── */}
      <section className="py-28 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase mb-4 border border-primary/20">
              Why TRIDENT
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-4">
              Everything You Need to Grow
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              We provide the infrastructure. You focus on creating exceptional
              fashion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                Icon: TrendingUp,
                color: "blue",
                title: "Transparent Revenue",
                desc: "No listing fees, no monthly subscriptions. You make money when you make a sale — a small commission only on successful orders.",
              },
              {
                Icon: Globe,
                color: "indigo",
                title: "Island-Wide Reach",
                desc: "Instantly reach thousands of active fashion shoppers across all of Cyprus — from Nicosia to Famagusta to Kyrenia.",
              },
              {
                Icon: Truck,
                color: "violet",
                title: "Effortless Delivery",
                desc: "We work with trusted local couriers. Pack your item, hand it to the driver — that's it. We handle the logistics infrastructure.",
              },
              {
                Icon: Megaphone,
                color: "purple",
                title: "Marketing Engine",
                desc: "Benefit from our SEO, Instagram campaigns, email marketing, and curated collections that bring high-intent buyers to your page.",
              },
            ].map(({ Icon, color, title, desc }) => (
              <div
                key={title}
                className={`bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group`}
              >
                <div
                  className={`w-14 h-14 bg-${color}-500/10 rounded-2xl flex items-center justify-center text-${color}-500 mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                  {title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase mb-4 border border-primary/20">
              The Process
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-4">
              Launch in 3 Simple Steps
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-lg">
              From application to your first sale — we make it fast and
              frictionless.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            {[
              {
                Icon: Zap,
                step: "01",
                title: "Submit Application",
                desc: "Fill in the short application form below. Tell us about your brand, your aesthetic, and how you operate. Takes less than 2 minutes.",
              },
              {
                Icon: ShieldCheck,
                step: "02",
                title: "Quick Review",
                desc: "Our curation team reviews your profile within 24–48 hours. We look for quality brands that align with our community standards.",
              },
              {
                Icon: BarChart3,
                step: "03",
                title: "Go Live & Grow",
                desc: "Set up your premium storefront, list your products, and start reaching thousands of shoppers across Cyprus from day one.",
              },
            ].map(({ Icon, step, title, desc }) => (
              <div
                key={step}
                className="relative flex flex-col items-center text-center p-8"
              >
                <div className="relative mb-8">
                  <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mb-0">
                    <Icon className="w-10 h-10 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white text-xs font-black rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                    {step}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
                  {title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm max-w-xs">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-28 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase mb-4 border border-primary/20">
              Vendor Stories
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
              Trusted by Creators
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Nadia K.",
                brand: "Aura Collective",
                location: "Kyrenia",
                quote:
                  "TRIDENT gave us the platform we needed. We went from selling at local markets to shipping island-wide in just two weeks after approval.",
                stars: 5,
              },
              {
                name: "Leila M.",
                brand: "Velvet Atelier",
                location: "Nicosia",
                quote:
                  "The zero-fee model is honestly revolutionary. We tried other platforms and the commissions were eating our margins. Not here.",
                stars: 5,
              },
              {
                name: "Emre D.",
                brand: "Urban Draft",
                location: "Famagusta",
                quote:
                  "Our store launched and within the first month we had over 40 orders. Their marketing reach is incredible for a platform this new.",
                stars: 5,
              },
            ].map(({ name, brand, location, quote, stars }) => (
              <div
                key={name}
                className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col"
              >
                <div className="flex gap-0.5 mb-6">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed italic mb-8 flex-1">
                  "{quote}"
                </p>
                <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-sm">
                    {name[0]}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white text-sm">
                      {name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {brand} · {location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── APPLICATION FORM ─── */}
      <section id="apply" className="py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col lg:flex-row">
              {/* Left info panel */}
              <div className="lg:w-5/12 p-10 md:p-14 bg-slate-900 dark:bg-slate-950 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full" />
                <div className="absolute -bottom-24 -left-16 w-64 h-64 bg-primary/5 rounded-full" />

                <div className="relative z-10">
                  <div className="inline-block bg-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-8">
                    Apply Today
                  </div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter text-white mb-4 leading-tight">
                    Start Your Brand Journey
                  </h2>
                  <p className="text-slate-400 mb-10 leading-relaxed">
                    We curate our sellers carefully to ensure quality. It takes
                    just 2 minutes to apply — we'll do the rest.
                  </p>

                  <div className="space-y-8">
                    {[
                      {
                        n: "1",
                        title: "Submit Application",
                        desc: "Tell us about your brand and your vision.",
                      },
                      {
                        n: "2",
                        title: "Quick Review",
                        desc: "Approval within 24–48 hours, guaranteed.",
                      },
                      {
                        n: "3",
                        title: "Go Live",
                        desc: "Set up your store and start selling immediately.",
                      },
                    ].map(({ n, title, desc }) => (
                      <div key={n} className="flex items-start gap-4">
                        <div className="w-9 h-9 rounded-full bg-primary text-white font-black flex items-center justify-center text-sm shrink-0 shadow-lg shadow-primary/30">
                          {n}
                        </div>
                        <div>
                          <h4 className="font-bold text-white mb-0.5">
                            {title}
                          </h4>
                          <p className="text-slate-400 text-sm">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative z-10 mt-12 pt-8 border-t border-white/10 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {["N", "L", "E", "M"].map((letter) => (
                      <div
                        key={letter}
                        className="w-8 h-8 rounded-full bg-primary/20 border-2 border-slate-900 text-primary font-bold text-xs flex items-center justify-center"
                      >
                        {letter}
                      </div>
                    ))}
                  </div>
                  <p className="text-slate-400 text-sm">
                    <span className="text-white font-bold">50+ brands</span>{" "}
                    already selling on TRIDENT
                  </p>
                </div>
              </div>

              {/* Right form panel */}
              <div className="lg:w-7/12 p-10 md:p-14">
                <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
                  Application Details
                </h3>
                <p className="text-slate-500 text-sm mb-10">
                  All fields marked with * are required.
                </p>

                <form action={formAction} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label
                        className="text-xs font-bold uppercase tracking-widest text-slate-500"
                        htmlFor="storeName"
                      >
                        Brand Name *
                      </label>
                      <Input
                        id="storeName"
                        name="storeName"
                        required
                        placeholder="e.g. Aura Collective"
                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-13 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        className="text-xs font-bold uppercase tracking-widest text-slate-500"
                        htmlFor="city"
                      >
                        City / Location *
                      </label>
                      <Input
                        id="city"
                        name="city"
                        required
                        placeholder="e.g. Kyrenia"
                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-13 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-xs font-bold uppercase tracking-widest text-slate-500"
                      htmlFor="description"
                    >
                      About Your Brand *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      required
                      rows={5}
                      placeholder="What's your aesthetic? What kind of pieces do you design? Who's your target customer?"
                      className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 resize-y focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label
                        className="text-xs font-bold uppercase tracking-widest text-slate-500"
                        htmlFor="instagram"
                      >
                        Instagram / Portfolio
                      </label>
                      <Input
                        id="instagram"
                        name="instagram"
                        placeholder="@yourbrand"
                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-13 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        className="text-xs font-bold uppercase tracking-widest text-slate-500"
                        htmlFor="whatsapp"
                      >
                        Contact Number *
                      </label>
                      <Input
                        id="whatsapp"
                        name="whatsapp"
                        required
                        placeholder="+90..."
                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-13 rounded-xl"
                      />
                    </div>
                  </div>

                  {state?.error && (
                    <div className="flex items-start gap-3 text-red-600 dark:text-red-400 bg-red-500/10 border border-red-200 dark:border-red-900/40 p-4 rounded-xl">
                      <span className="shrink-0 mt-0.5">⚠</span>
                      <p className="text-sm font-medium">{state.error}</p>
                    </div>
                  )}

                  <SubmitButton className="w-full h-14 bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity mt-2 shadow-xl text-sm flex items-center justify-center gap-2">
                    Submit Application <ArrowRight className="w-4 h-4" />
                  </SubmitButton>

                  <p className="text-center text-xs text-slate-400 font-medium">
                    By applying, you agree to our{" "}
                    <Link
                      href="#"
                      className="underline hover:text-primary transition-colors"
                    >
                      Vendor Terms & Conditions
                    </Link>
                    . We'll never share your information.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-28 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase mb-4 border border-primary/20">
              FAQ
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
              Common Questions
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} {...faq} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-6">
            Ready to Make Your Mark?
          </h2>
          <p className="text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
            Join the brands already selling on TRIDENT. Your audience is
            waiting.
          </p>
          <a
            href="#apply"
            className="inline-flex items-center gap-2 px-10 py-5 bg-primary text-white font-black rounded-2xl hover:opacity-90 transition-opacity shadow-2xl shadow-primary/30 text-lg uppercase tracking-widest"
          >
            Start Your Application <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>
    </div>
  );
}
