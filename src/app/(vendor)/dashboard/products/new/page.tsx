'use client'

import { useActionState } from 'react'
import { createProduct } from '../actions'
import Link from 'next/link'

const CATEGORIES = ['Women', 'Men', 'Accessories', 'Kids', 'Sport', 'Casual']

export default function NewProductPage() {
    const [state, formAction] = useActionState(createProduct, null)

    return (
        <div className="max-w-2xl space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/products" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Add New Product</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Fill in the details to list a new product in your store.</p>
                </div>
            </div>

            <form action={formAction} className="space-y-6 bg-white dark:bg-slate-950 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                {/* Product Name */}
                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-bold uppercase tracking-widest text-slate-500">Product Name *</label>
                    <input
                        id="name"
                        name="name"
                        required
                        placeholder="e.g. Silk Minimalist Gown"
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    />
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-bold uppercase tracking-widest text-slate-500">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        rows={4}
                        placeholder="Describe the product, material, fit, etc."
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
                    />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="price" className="text-sm font-bold uppercase tracking-widest text-slate-500">Current Price ($) *</label>
                        <input
                            id="price"
                            name="price"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            placeholder="e.g. 49.99"
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="original_price" className="text-sm font-bold uppercase tracking-widest text-slate-500">
                            Original Price ($)
                            <span className="normal-case font-normal ml-2 text-slate-400">(leave blank if no discount)</span>
                        </label>
                        <input
                            id="original_price"
                            name="original_price"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g. 89.99"
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                        />
                        <p className="text-xs text-slate-400">When set higher than current price, a crossed-out "was" price and a Sale badge will appear on the product card.</p>
                    </div>
                </div>

                {/* Category & Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="category" className="text-sm font-bold uppercase tracking-widest text-slate-500">Category</label>
                        <select
                            id="category"
                            name="category"
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                        >
                            <option value="">Select a category</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="stock_quantity" className="text-sm font-bold uppercase tracking-widest text-slate-500">Stock Quantity</label>
                        <input
                            id="stock_quantity"
                            name="stock_quantity"
                            type="number"
                            min="0"
                            defaultValue={1}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                        />
                    </div>
                </div>

                {/* Image URL */}
                <div className="space-y-2">
                    <label htmlFor="image_url" className="text-sm font-bold uppercase tracking-widest text-slate-500">Product Image URL</label>
                    <input
                        id="image_url"
                        name="image_url"
                        type="url"
                        placeholder="https://..."
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    />
                </div>

                {state?.error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                        <p className="text-red-600 dark:text-red-400 text-sm font-semibold">{state.error}</p>
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <Link
                        href="/dashboard/products"
                        className="flex-1 py-3 text-center border-2 border-slate-200 dark:border-slate-700 text-sm font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        className="flex-1 py-3 bg-black dark:bg-white text-white dark:text-black text-sm font-black uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-colors shadow-lg"
                    >
                        Add Product
                    </button>
                </div>
            </form>
        </div>
    )
}
