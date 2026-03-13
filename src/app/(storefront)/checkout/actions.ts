'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CartItem, DiscountInfo } from '@/lib/store'

export async function placeOfflineOrder(formData: FormData, cartItems: CartItem[], cartTotal: number, discountCode?: string | null) {
    const supabase = await createClient()

    // Minimal auth check (guest allowed, but we try to link to user if logged in)
    const { data: { user } } = await supabase.auth.getUser()

    // 0. Recalculate cartTotal server-side for security.
    // Only query DB for items with valid UUID product IDs — static/mock items fall back to client price.
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const productIds = cartItems
        .map(item => item.id.replace('prod_', ''))
        .filter(id => UUID_REGEX.test(id))

    let dbProducts: { id: string; price: number }[] = []
    if (productIds.length > 0) {
        const { data, error: productsError } = await supabase
            .from('products')
            .select('id, price')
            .in('id', productIds)
        if (productsError) {
            console.error('Product price lookup error:', JSON.stringify(productsError))
        } else {
            dbProducts = data || []
        }
    }

    let secureCartTotal = 0
    const verifiedOrderItems = cartItems.map(clientItem => {
        const cleanId = clientItem.id.replace('prod_', '')
        const dbProduct = dbProducts.find(p => p.id === cleanId)
        const actualPrice = dbProduct ? dbProduct.price : clientItem.price // fallback for mocked/static products
        secureCartTotal += actualPrice * clientItem.quantity
        return {
            ...clientItem,
            price: actualPrice
        }
    })

    let finalTotal = secureCartTotal
    let appliedDiscountId = null

    // 1. Validate Discount Code (Server-side check)
    if (discountCode) {
        const { data: discount, error } = await supabase
            .from('discount_codes')
            .select('*')
            .eq('code', discountCode.toUpperCase())
            .eq('is_active', true)
            .single()

        if (!error && discount) {
            const isValidExpiry = !discount.valid_until || new Date(discount.valid_until) >= new Date()
            const isValidUse = !discount.max_uses || discount.current_uses < discount.max_uses
            const isValidMin = !discount.min_purchase_amount || secureCartTotal >= discount.min_purchase_amount

            if (isValidExpiry && isValidUse && isValidMin) {
                appliedDiscountId = discount.id
                let savings = 0
                if (discount.discount_type === 'percentage') {
                    savings = secureCartTotal * (discount.discount_value / 100)
                } else if (discount.discount_type === 'fixed') {
                    savings = discount.discount_value
                }
                finalTotal = Math.max(0, secureCartTotal - savings)
            }
        }
    }

    // Grab the form fields
    const addressLine = formData.get('address') as string
    const apartmentNumber = (formData.get('apartmentNumber') as string) || null
    const fullAddress = apartmentNumber ? `${addressLine}, ${apartmentNumber}` : addressLine

    // Only use store_id if it looks like a valid UUID (not 'vendor_123' or empty)
    const rawStoreId = cartItems[0]?.vendorId || ''
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawStoreId)
    const storeId = isValidUuid ? rawStoreId : null

    const data = {
        email: '',        // not collected at checkout; kept for DB NOT NULL compatibility
        phone: '',        // not collected at checkout; kept for DB NOT NULL compatibility
        first_name: formData.get('firstName') as string,
        last_name: formData.get('lastName') as string,
        address: fullAddress,
        map_link: (formData.get('mapLink') as string) || null,
        delivery_method: formData.get('deliveryMethod') as string,
        user_id: user?.id || null,
        total_amount: finalTotal,
        store_id: storeId
    }

    // 2. Create the Order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([data])
        .select('id')
        .single()

    if (orderError || !order) {
        console.error('Failed to create order — DB error:', JSON.stringify(orderError))
        throw new Error('Failed to create order')
    }

    // 3. Insert Order Items
    const orderItemsRecord = verifiedOrderItems.map(item => ({
        order_id: order.id,
        product_id: item.id.replace('prod_', ''),
        product_name: item.name,
        product_image: item.image,
        quantity: item.quantity,
        price: item.price
    }))

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsRecord)

    if (itemsError) {
        // Log but don't crash — order is already created
        console.error('Failed to insert order items — DB error:', JSON.stringify(itemsError))
    }

    // 4. Update Discount Code Usage Count
    if (appliedDiscountId) {
        // We use an RPC call or simple update to increment
        // Note: For high concurrency, an RPC is better to avoid race conditions.
        // For this MVP, a simple read/increment/write or raw SQL would be ideal.
        // Supabase REST API doesn't have simple increment without RPC, so we fetch current then update.
        const { data: currentDiscount } = await supabase
            .from('discount_codes')
            .select('current_uses')
            .eq('id', appliedDiscountId)
            .single()

        if (currentDiscount) {
            await supabase
                .from('discount_codes')
                .update({ current_uses: currentDiscount.current_uses + 1 })
                .eq('id', appliedDiscountId)
        }
    }

    // Redirect to success page
    redirect(`/checkout/success?order_id=${order.id}`)
}
