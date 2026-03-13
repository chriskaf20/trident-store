"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface FilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const CATEGORIES = ["Women", "Men", "Accessories"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export function FilterDrawer({ isOpen, onClose }: FilterDrawerProps) {
    const router = useRouter();
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [maxPrice, setMaxPrice] = useState(500);

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const toggleSize = (size: string) => {
        setSelectedSizes(prev =>
            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
        );
    };

    const applyFilters = () => {
        const params = new URLSearchParams();
        if (selectedCategories.length === 1) params.set("category", selectedCategories[0]);
        if (maxPrice < 500) params.set("maxPrice", String(maxPrice));
        if (selectedSizes.length > 0) params.set("sizes", selectedSizes.join(","));
        router.push(`/products?${params.toString()}`);
        onClose();
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedSizes([]);
        setMaxPrice(500);
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div className={`fixed top-0 right-0 h-full w-80 max-w-full bg-white dark:bg-slate-950 z-50 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-black uppercase tracking-widest text-black dark:text-white">Filters</h2>
                    <button onClick={onClose} className="p-1.5 text-black dark:text-white hover:text-amber-600 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                    {/* Categories */}
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-black dark:text-white">Category</h3>
                        <div className="space-y-2">
                            {CATEGORIES.map(cat => (
                                <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                                    <div
                                        onClick={() => toggleCategory(cat)}
                                        className={`w-5 h-5 border-2 flex items-center justify-center cursor-pointer transition-colors ${selectedCategories.includes(cat) ? "bg-black dark:bg-white border-black dark:border-white" : "border-slate-300 dark:border-slate-600"}`}
                                    >
                                        {selectedCategories.includes(cat) && (
                                            <span className="material-symbols-outlined !text-[14px] text-white dark:text-black font-black">check</span>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-black dark:group-hover:text-white transition-colors">{cat}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Price Range */}
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-black dark:text-white">Price Range</h3>
                        <input
                            type="range"
                            min={0}
                            max={500}
                            value={maxPrice}
                            onChange={e => setMaxPrice(Number(e.target.value))}
                            className="w-full accent-black dark:accent-white"
                        />
                        <div className="flex justify-between text-sm font-medium mt-2 text-slate-600 dark:text-slate-400">
                            <span>$0</span>
                            <span className="font-black text-black dark:text-white">${maxPrice === 500 ? "500+" : maxPrice}</span>
                        </div>
                    </div>

                    {/* Size */}
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-black dark:text-white">Size</h3>
                        <div className="flex flex-wrap gap-2">
                            {SIZES.map(size => (
                                <button
                                    key={size}
                                    onClick={() => toggleSize(size)}
                                    className={`w-12 h-12 border-2 text-sm font-black transition-all ${selectedSizes.includes(size) ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white" : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-black dark:hover:border-white"}`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                    <button
                        onClick={clearFilters}
                        className="flex-1 py-3 border-2 border-black dark:border-white text-black dark:text-white text-sm font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Clear
                    </button>
                    <button
                        onClick={applyFilters}
                        className="flex-1 py-3 bg-black dark:bg-white text-white dark:text-black text-sm font-black uppercase tracking-widest hover:bg-amber-600 transition-colors"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </>
    );
}
