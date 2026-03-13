"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/Button";

interface SidebarProps {
    storeExists: boolean;
    storeName?: string;
    userEmail: string;
}

export function Sidebar({ storeExists, storeName, userEmail }: SidebarProps) {
    const pathname = usePathname();

    const navLinks = [
        { name: "Overview", href: "/dashboard", icon: "home" },
        { name: "Products", href: "/dashboard/products", icon: "inventory_2" },
        { name: "Discount Codes", href: "/dashboard/discount-codes", icon: "local_offer" },
        { name: "Orders", href: "/dashboard/orders", icon: "receipt_long" },
        { name: "Settings", href: "/dashboard/settings", icon: "settings" },
    ];

    return (
        <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex-col hidden md:flex shrink-0">
            {/* Header */}
            <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-200 dark:border-slate-800 gap-1">
                <Link href="/">
                    <Image
                        src="/logo.svg"
                        alt="Trident Store"
                        width={140}
                        height={35}
                        className="h-8 w-auto object-contain dark:[filter:invert(0.85)_brightness(1.5)]"
                        priority
                    />
                </Link>
                {storeName && <p className="text-xs text-slate-500 font-medium truncate">{storeName}</p>}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2">
                {storeExists ? (
                    navLinks.map((link) => {
                        const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== "/dashboard");

                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                                    isActive
                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                            >
                                <span className={cn("material-symbols-outlined !text-[20px]", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900")}>
                                    {link.icon}
                                </span>
                                {link.name}
                            </Link>
                        );
                    })
                ) : (
                    <div className="text-center p-4">
                        <span className="material-symbols-outlined !text-4xl text-slate-300 mb-2">store</span>
                        <p className="text-sm text-slate-500 font-medium">Please set up your store to access the dashboard.</p>
                        <Link href="/vendor-apply" className="block mt-4 bg-primary text-white font-bold py-2 rounded-lg text-sm">Apply Now</Link>
                    </div>
                )}
            </nav>

            {/* Footer / User */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <form action="/auth/signout" method="post">
                    <button type="submit" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 w-full text-left">
                        <span className="material-symbols-outlined !text-[20px] text-slate-400 group-hover:text-red-600">logout</span>
                        Sign Out
                    </button>
                </form>
            </div>
        </aside>
    );
}
