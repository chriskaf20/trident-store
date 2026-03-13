import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    vendorId: string;
    vendorName: string;
}

export interface DiscountInfo {
    id: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    savings: number; // calculated savings based on cart total
}

interface CartState {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    cartTotal: () => number;
    cartCount: () => number;
    cartFinalTotal: () => number;
    discount: DiscountInfo | null;
    applyDiscount: (discount: DiscountInfo) => void;
    removeDiscount: () => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (item) => {
                set((state) => {
                    const existingItem = state.items.find((i) => i.id === item.id);
                    if (existingItem) {
                        // If item already exists, just increase quantity
                        return {
                            items: state.items.map((i) =>
                                i.id === item.id ? { ...i, quantity: i.quantity + (item.quantity ?? 1) } : i
                            ),
                        };
                    }
                    // If new item, add to array
                    return { items: [...state.items, { ...item, quantity: item.quantity ?? 1 }] };
                });
            },
            removeItem: (id) => {
                set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
            },
            updateQuantity: (id, quantity) => {
                set((state) => {
                    if (quantity <= 0) {
                        return { items: state.items.filter((i) => i.id !== id) };
                    }
                    return {
                        items: state.items.map((i) =>
                            i.id === id ? { ...i, quantity } : i
                        ),
                    };
                });
            },
            clearCart: () => set({ items: [] }),
            cartTotal: () => {
                return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
            },
            cartCount: () => {
                return get().items.reduce((count, item) => count + item.quantity, 0);
            },
            cartFinalTotal: () => {
                const total = get().cartTotal();
                const discount = get().discount;
                if (!discount) return total;
                // Double check calculation to ensure it matches current total
                let savings = 0;
                if (discount.type === 'percentage') {
                    savings = total * (discount.value / 100);
                } else {
                    savings = discount.value;
                }
                return Math.max(0, total - savings);
            },
            discount: null,
            applyDiscount: (discount) => set({ discount }),
            removeDiscount: () => set({ discount: null }),
        }),
        {
            name: 'trident-store-cart', // Unique key for localStorage
        }
    )
);
