'use client'

import { useActionState, useState } from 'react'
import { createProduct } from '../../actions'
import Link from 'next/link'
import Image from 'next/image'

const CATEGORIES = ['Women', 'Men', 'Accessories', 'Kids', 'Sport', 'Casual']

export default function NewProductPage() {
    const [state, formAction] = useActionState(createProduct, null)
    const [preview, setPreview] = useState<string | null>(null)

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setPreview(url)
        }
    }

    return (
        <div className="p-8 md:p-12 max-w-2xl">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/dashboard/products"
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </Link>
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter">Add New Product</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Fill in the details to list a new product in your store.</p>
                </div>
            </div>

            <form action={formAction} encType="multipart/form-data" className="space-y-6 bg-white dark:bg-slate-950 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">

                {/* Product Image Upload */}
                <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Product Image
                    </label>
                    <div className="flex flex-col items-center gap-4">
                        {/* Preview */}
                        <div className="w-full h-48 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-900 relative">
                            {preview ? (
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-center">
                                    <span className="material-symbols-outlined !text-4xl text-slate-300 mb-2 block">add_photo_alternate</span>
                                    <p className="text-sm text-slate-400">Click below to upload an image</p>
                                    <p className="text-xs text-slate-300 mt-1">JPG, PNG, WebP up to 5MB</p>
                                </div>
                            )}
                        </div>
                        <label
                            htmlFor="image"
                            className="w-full py-3 text-center border-2 border-slate-200 dark:border-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined !text-[18px]">upload</span>
                            {preview ? 'Change Image' : 'Upload Image'}
                        </label>
                        <input
                            id="image"
                            name="image"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageChange}
                            className="hidden"
                            required
                        />
                    </div>
                </div>

                {/* Product Name */}
                <div className="space-y-2">
                    <label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Product Name *
                    </label>
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
                    <label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Description
                    </label>
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
                        <label htmlFor="price" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                            Price (TL) *
                        </label>
                        <input
                            id="price"
                            name="price"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            placeholder="e.g. 499.99"
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="original_price" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                            Original Price (TL)
                            <span className="normal-case font-normal ml-1 text-slate-400">(optional)</span>
                        </label>
                        <input
                            id="original_price"
                            name="original_price"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g. 899.99"
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                        />
                        <p className="text-xs text-slate-400">Set higher than price to show a sale badge.</p>
                    </div>
                </div>

                {/* Category & Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="category" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                            Category
                        </label>
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
                        <label htmlFor="stock" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                            Stock Quantity
                        </label>
                        <input
                            id="stock"
                            name="stock"
                            type="number"
                            min="0"
                            defaultValue={1}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                        />
                    </div>
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
                        className="flex-1 py-3 bg-foreground text-background text-sm font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
                    >
                        Add Product
                    </button>
                </div>
            </form>
        </div>
    )
}
