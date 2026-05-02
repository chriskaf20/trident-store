'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CartItem } from '@/lib/store'
import { reserveVariantStock } from '@/lib/services/inventory.service'
import { ValidationError, DatabaseError } from '@/lib/errors'

/**
 * PRODUCTION-GRADE CHECKOUT ACTION
 * Implements Multi-Vendor Order Splitting (Parent -> Sub-orders)
 */
export async function placeOrder(formData: FormData, cartItems: CartItem[], cartTotal: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        throw new ValidationError('Authentication required.')
    }

    // 1. CREATE PARENT ORDER (Customer Level)
    const { data: parentOrder, error: parentError } = await supabase
        .from('orders')
        .insert([{
            user_id: user.id,
            total_amount: cartTotal,
            status: 'pending',
            shipping_address_id: formData.get('addressId') as string || null
        }])
        .select('id')
        .single()

    if (parentError || !parentOrder) {
        throw new DatabaseError(`Failed to create order: ${parentError?.message}`)
    }

    // 2. GROUP ITEMS BY VENDOR
    // Expecting cartItems to have vendorId and variantId (Updated from old productId)
    const vendorMap = cartItems.reduce((acc: any, item: any) => {
        const vId = item.vendorId || 'unknown'
        if (!acc[vId]) acc[vId] = []
        acc[vId].push(item)
        return acc
    }, {})

    // 3. PROCESS EACH VENDOR SUB-ORDER
    for (const [vendorId, items] of Object.entries(vendorMap)) {
        const subtotal = (items as any[]).reduce((sum, item) => sum + (item.price * item.quantity), 0)
        
        // Simple 10% commission logic (should be dynamic in production)
        const commission = subtotal * 0.10

        const { data: vendorOrder, error: vError } = await supabase
            .from('vendor_orders')
            .insert([{
                order_id: parentOrder.id,
                vendor_id: vendorId,
                subtotal: subtotal,
                commission_amount: commission,
                status: 'pending'
            }])
            .select('id')
            .single()

        if (vError || !vendorOrder) {
            console.error(`Failed to create sub-order for vendor ${vendorId}:`, vError?.message)
            continue
        }

        // 4. INSERT LINE ITEMS & RESERVE STOCK
        const lineItems = (items as any[]).map(item => ({
            vendor_order_id: vendorOrder.id,
            variant_id: item.variantId || item.id, // Fallback for transition
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity
        }))

        const { error: itemsError } = await supabase.from('order_items').insert(lineItems)
        
        if (itemsError) {
            console.error('Failed to insert order items:', itemsError.message)
        }

        // Atomic stock reservation per variant
        for (const item of items as any[]) {
            try {
                await reserveVariantStock(item.variantId || item.id, item.quantity)
            } catch (err) {
                console.error(`Stock reservation failed for ${item.id}:`, err)
            }
        }
    }

    // 5. INITIALIZE TRANSACTION
    await supabase.from('transactions').insert([{
        order_id: parentOrder.id,
        amount: cartTotal,
        type: 'payment',
        reference_id: `checkout_${parentOrder.id}`
    }])

    redirect(`/checkout/success?order_id=${parentOrder.id}`)
}
