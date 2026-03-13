'use client'

import { useCartStore } from '@/lib/store'
import Link from 'next/link'
import { Trash2, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PromoCodeForm } from '@/components/storefront/PromoCodeForm'

export default function CartPage() {
    const { items, removeItem, updateQuantity, cartTotal, cartFinalTotal, discount } = useCartStore()
    // Hydration fix for zustand persist
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    if (!mounted) return null

    if (items.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center h-[50vh]">
                <ShoppingBag className="w-16 h-16 text-neutral-300 mb-6" />
                <h2 className="text-2xl font-medium mb-4">Your cart is empty</h2>
                <p className="text-neutral-500 mb-8 max-w-md">Looks like you haven't added anything to your cart yet. Explore our stores and find something you love.</p>
                <Link href="/stores" className="bg-black text-white px-8 py-3 uppercase tracking-widest text-sm font-semibold hover:bg-neutral-800 transition-colors">
                    Continue Shopping
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 w-full animate-in fade-in">
            <h1 className="text-4xl font-bold mb-10">Your Cart</h1>

            <div className="flex flex-col lg:flex-row gap-12">
                {/* Cart Items */}
                <div className="flex-1 space-y-6">
                    {items.map((item) => (
                        <div key={item.id} className="flex gap-6 py-6 border-b border-neutral-200">
                            <div className="w-24 h-32 bg-neutral-100 flex-shrink-0">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-neutral-200" />
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-lg font-medium">{item.name}</h3>
                                        <p className="font-medium">{item.price.toLocaleString()} TL</p>
                                    </div>
                                    <p className="text-sm text-neutral-500 mt-1">{item.vendorName}</p>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-neutral-500">Qty:</span>
                                        <select
                                            className="border border-neutral-300 p-1 rounded-sm bg-background text-foreground"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                    </div>
                                    <button onClick={() => removeItem(item.id)} className="text-neutral-400 hover:text-red-500 transition-colors flex items-center gap-1 text-sm">
                                        <Trash2 className="w-4 h-4" /> Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="w-full lg:w-96 bg-neutral-50 p-8 h-fit border border-neutral-100 rounded-xl">
                    <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                    <div className="space-y-4 text-neutral-600 border-b border-neutral-200 pb-6 mb-6">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{cartTotal().toLocaleString()} TL</span>
                        </div>
                        {discount && (
                            <div className="flex justify-between text-green-600">
                                <span>Discount ({discount.code})</span>
                                <span>-{discount.savings.toLocaleString()} TL</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span>Delivery</span>
                            <span>Calculated at checkout</span>
                        </div>
                    </div>

                    <div className="mb-8">
                        <PromoCodeForm />
                    </div>

                    <div className="flex justify-between text-lg font-bold mb-8 items-end">
                        <span>Total</span>
                        <span className="text-2xl">{cartFinalTotal().toLocaleString()} TL</span>
                    </div>
                    <Link href="/checkout" className="w-full bg-black text-white py-4 uppercase tracking-widest text-sm font-bold hover:bg-neutral-800 transition-colors flex items-center justify-center rounded-lg shadow-xl shadow-black/10">
                        Proceed to Checkout
                    </Link>
                    <p className="text-xs text-neutral-500 text-center mt-4 border-t border-neutral-200 pt-4">Cash on Delivery and In-Store Pickup available</p>
                </div>
            </div>
        </div>
    )
}
