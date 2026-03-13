"use client";

import { useCartStore } from "@/lib/store";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { items, removeItem, updateQuantity, cartCount, cartTotal } = useCartStore();
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const total = cartTotal();
    const count = hasMounted ? cartCount() : 0;

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div
                className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background shadow-2xl transition-transform duration-300 ease-in-out md:rounded-l-2xl border-l border-border flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5" />
                        <h2 className="text-lg font-bold">Your Cart</h2>
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                            {count}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-70">
                            <ShoppingBag className="w-16 h-16 text-muted-foreground" />
                            <div>
                                <h3 className="text-lg font-bold">Your cart is empty</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Looks like you haven't added any items yet.
                                </p>
                            </div>
                            <Button onClick={onClose} className="mt-4">
                                Continue Shopping
                            </Button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div
                                key={item.id}
                                className="flex gap-4 p-4 rounded-xl border border-border/50 bg-secondary/20"
                            >
                                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-secondary shrink-0">
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        sizes="96px"
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-semibold text-sm line-clamp-2">
                                                {item.name}
                                            </h4>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-muted-foreground hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {item.vendorName}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="font-bold text-sm">
                                            {item.price.toLocaleString()} TL
                                        </div>
                                        <div className="flex items-center gap-3 bg-background border border-border rounded-full px-2 py-1">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-xs font-semibold w-4 text-center">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <div className="p-6 border-t border-border bg-secondary/10">
                        <div className="flex justify-between mb-4 mt-2">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-bold">{total.toLocaleString()} TL</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-6">
                            Shipping and taxes calculated at checkout.
                        </p>
                        <Link href="/checkout" onClick={onClose} className="block w-full">
                            <Button className="w-full relative group h-14 text-base">
                                Proceed to Checkout
                                <ArrowRight className="absolute right-4 w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
}
