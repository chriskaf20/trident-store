/**
 * Vendor Order Management Actions
 * Handles order status updates, tracking, and fulfillment workflow
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireVendor } from '@/lib/supabase/guards'
import { AuthorizationError, ValidationError, NotFoundError } from '@/lib/errors'
import { notifyOrderStatusChanged } from '@/lib/services/notifications.service'

/**
 * Get orders for a vendor (from their store)
 * Filters to show only orders containing items from vendor's store
 */
export async function getVendorOrders(
    storeId: string,
    status?: string,
    limit: number = 50,
    offset: number = 0
) {
    const { user } = await requireVendor()
    const supabase = await createClient()

    // Verify ownership of vendor
    const { data: store, error: storeError } = await supabase
        .from('vendors')
        .select('owner_id')
        .eq('id', storeId)
        .single()

    if (storeError || !store) {
        throw new NotFoundError('Store')
    }

    if (store.owner_id !== user.id) {
        throw new AuthorizationError('You do not have permission to view this store\'s orders')
    }

    // Get orders with items from this store
    // Use !inner join to filter orders that have items from this store
    // This allows us to sort by orders.created_at which exists (unlike order_items.created_at)
    let query = supabase
        .from('orders')
        .select(
            `
            id,
            first_name,
            last_name,
            email,
            phone,
            address,
            delivery_method,
            total_amount,
            status,
            created_at,
            order_items!inner (
                id,
                product_name,
                quantity,
                price,
                status,
                tracking_number,
                shipped_at,
                store_id
            )
            `,
            { count: 'exact' }
        )
        .eq('order_items.store_id', storeId)
        .order('created_at', { ascending: false })

    if (status) {
        query = query.eq('order_items.status', status)
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
        throw new Error(`Failed to fetch vendor orders: ${error.message}`)
    }

    // Map data to the expected format
    const formattedOrders = data?.map((order: any) => ({
        ...order,
        items: order.order_items.map((item: any) => ({
            id: item.id,
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            status: item.status,
            tracking_number: item.tracking_number,
            shipped_at: item.shipped_at
        }))
    }))

    return {
        orders: formattedOrders || [],
        total: count || 0,
        limit,
        offset
    }
}

/**
 * Get a single order with all its items
 */
export async function getVendorOrderDetail(orderId: string, storeId: string) {
    const { user } = await requireVendor()
    const supabase = await createClient()

    // Verify vendor owns this vendor profile
    const { data: store, error: storeError } = await supabase
        .from('vendors')
        .select('owner_id')
        .eq('id', storeId)
        .single()

    if (storeError || !store || store.owner_id !== user.id) {
        throw new AuthorizationError('You do not have permission to view this store\'s orders')
    }

    // Get order with its items from vendor's store
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(
            `
            *,
            order_items (
                id,
                product_id,
                product_name,
                product_image,
                quantity,
                price,
                store_id,
                status,
                tracking_number,
                shipped_at
            ),
            profiles (
                full_name,
                phone_number,
                avatar_emoji
            )
            `
        )
        .eq('id', orderId)
        .single()

    if (orderError || !order) {
        throw new NotFoundError('Order')
    }

    // Filter to only show items from this vendor's store
    const vendorItems = order.order_items.filter((item: any) => item.store_id === storeId)
    if (vendorItems.length === 0) {
        throw new AuthorizationError('This order does not contain items from your store')
    }

    return {
        ...order,
        order_items: vendorItems
    }
}

/**
 * Update order item status (for vendor fulfillment workflow)
 * Status flow: pending → confirmed → processing → shipped → delivered
 */
export async function updateOrderItemStatus(
    orderId: string,
    itemId: string,
    newStatus: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
    trackingNumber?: string
) {
    const { user } = await requireVendor()
    const supabase = await createClient()

    // Validate status transition
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(newStatus)) {
        throw new ValidationError(`Invalid status: ${newStatus}`)
    }

    // Fetch the item to verify vendor owns it
    const { data: item, error: itemError } = await supabase
        .from('order_items')
        .select('store_id, status')
        .eq('id', itemId)
        .single()

    if (itemError || !item) {
        throw new NotFoundError('Order item')
    }

    // Verify vendor owns this vendor profile
    const { data: store, error: storeError } = await supabase
        .from('vendors')
        .select('owner_id')
        .eq('id', item.store_id)
        .single()

    if (storeError || !store || store.owner_id !== user.id) {
        throw new AuthorizationError('You do not have permission to update this item')
    }

    // Update the item status
    const updateData: any = { status: newStatus }
    
    // Set shipped_at timestamp when transitioning to shipped
    if (newStatus === 'shipped' && item.status !== 'shipped') {
        updateData.shipped_at = new Date().toISOString()
    }
    
    // Add tracking number if provided
    if (trackingNumber) {
        updateData.tracking_number = trackingNumber
    }

    const { error: updateError } = await supabase
        .from('order_items')
        .update(updateData)
        .eq('id', itemId)

    if (updateError) {
        throw new Error(`Failed to update order item: ${updateError.message}`)
    }

    // Send email notification to customer about status change
    try {
        const { data: order } = await supabase
            .from('orders')
            .select('*, profiles(email, full_name)')
            .eq('id', orderId)
            .single()

        if (order && order.profiles) {
            const mapStatusToStep: Record<string, 'confirmed' | 'processing' | 'shipped' | 'delivered'> = {
                'confirmed': 'confirmed',
                'processing': 'processing',
                'shipped': 'shipped',
                'delivered': 'delivered'
            }

            if (mapStatusToStep[newStatus]) {
                await notifyOrderStatusChanged({
                    orderId,
                    customerEmail: order.profiles.email,
                    customerName: order.profiles.full_name || 'Customer',
                    status: mapStatusToStep[newStatus],
                    trackingNumber,
                    estimatedDelivery: newStatus === 'shipped' ? 'Within 3-5 business days' : undefined
                })
            }
        }
    } catch (error) {
        console.error('Failed to send status change email:', error)
        // Don't fail the order update if email fails
    }

    revalidatePath(`/dashboard/orders/${orderId}`)
    
    return { success: true, itemId, newStatus }
}

/**
 * Confirm order (vendor marks as ready to process)
 * Transitions pending items to confirmed
 */
export async function confirmVendorOrder(orderId: string, storeId: string) {
    const { user } = await requireVendor()
    const supabase = await createClient()

    // Verify vendor owns vendor profile
    const { data: store } = await supabase
        .from('vendors')
        .select('owner_id')
        .eq('id', storeId)
        .single()

    if (!store || store.owner_id !== user.id) {
        throw new AuthorizationError('You do not have permission to confirm this order')
    }

    // Update all pending items from this vendor to confirmed
    const { error } = await supabase
        .from('order_items')
        .update({ status: 'confirmed' })
        .eq('store_id', storeId)
        .eq('order_id', orderId)
        .eq('status', 'pending')

    if (error) {
        throw new Error(`Failed to confirm order: ${error.message}`)
    }

    revalidatePath(`/dashboard/orders`)
    
    return { success: true, orderId }
}

/**
 * Ship order item with tracking number
 */
export async function shipOrderItem(
    itemId: string,
    trackingNumber: string
) {
    const { user } = await requireVendor()
    const supabase = await createClient()

    if (!trackingNumber || trackingNumber.trim().length === 0) {
        throw new ValidationError('Tracking number is required')
    }

    // Fetch item to verify vendor ownership
    const { data: item, error: itemError } = await supabase
        .from('order_items')
        .select('store_id, order_id')
        .eq('id', itemId)
        .single()

    if (itemError || !item) {
        throw new NotFoundError('Order item')
    }

    // Verify vendor owns the vendor profile
    const { data: store } = await supabase
        .from('vendors')
        .select('owner_id')
        .eq('id', item.store_id)
        .single()

    if (!store || store.owner_id !== user.id) {
        throw new AuthorizationError('You do not have permission to ship this item')
    }

    // Update item status to shipped with tracking
    const { error: updateError } = await supabase
        .from('order_items')
        .update({
            status: 'shipped',
            tracking_number: trackingNumber,
            shipped_at: new Date().toISOString()
        })
        .eq('id', itemId)

    if (updateError) {
        throw new Error(`Failed to ship item: ${updateError.message}`)
    }

    // TODO: Send shipping notification email to customer
    // This will be implemented in Step 2.1

    revalidatePath(`/dashboard/orders/${item.order_id}`)
    
    return { success: true, itemId, trackingNumber }
}

/**
 * Cancel order item (vendor cancels before shipping)
 */
export async function cancelOrderItem(itemId: string, reason: string = 'Vendor cancelled') {
    const { user } = await requireVendor()
    const supabase = await createClient()

    // Fetch item
    const { data: item, error: itemError } = await supabase
        .from('order_items')
        .select('store_id, order_id, variant_id, quantity')
        .eq('id', itemId)
        .single()

    if (itemError || !item) {
        throw new NotFoundError('Order item')
    }

    // Verify vendor owns vendor profile
    const { data: store } = await supabase
        .from('vendors')
        .select('owner_id')
        .eq('id', item.store_id)
        .single()

    if (!store || store.owner_id !== user.id) {
        throw new AuthorizationError('You do not have permission to cancel this item')
    }

    // Cancel the item
    const { error: updateError } = await supabase
        .from('order_items')
        .update({ status: 'cancelled' })
        .eq('id', itemId)

    if (updateError) {
        throw new Error(`Failed to cancel item: ${updateError.message}`)
    }

    // Restore stock if variant tracking is enabled
    if (item.variant_id) {
        const { decrementVariantStock } = await import('@/lib/services/inventory.service')
        try {
            // Negative quantity decrement = stock restore on cancellation
            await decrementVariantStock(item.variant_id, -item.quantity, item.order_id)
        } catch (e) {
            console.error('Failed to restore stock:', e)
            // Non-blocking error
        }
    }

    // TODO: Send refund email to customer
    // This will be implemented in Phase 3 (returns & refunds)

    revalidatePath(`/dashboard/orders/${item.order_id}`)
    
    return { success: true, itemId, reason }
}

/**
 * Get order statistics for vendor dashboard
 */
export async function getVendorOrderStats(storeId: string) {
    const { user } = await requireVendor()
    const supabase = await createClient()

    // Verify vendor owns vendor profile
    const { data: store } = await supabase
        .from('vendors')
        .select('owner_id')
        .eq('id', storeId)
        .single()

    if (!store || store.owner_id !== user.id) {
        throw new AuthorizationError('You do not have permission to view this store')
    }

    // Get stats
    const { data: items } = await supabase
        .from('order_items')
        .select('status, price, quantity')
        .eq('store_id', storeId)

    if (!items) {
        return {
            totalOrders: 0,
            pending: 0,
            confirmed: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0,
            totalRevenue: 0
        }
    }

    const stats = {
        totalOrders: items.length,
        pending: items.filter((i: any) => i.status === 'pending').length,
        confirmed: items.filter((i: any) => i.status === 'confirmed').length,
        processing: items.filter((i: any) => i.status === 'processing').length,
        shipped: items.filter((i: any) => i.status === 'shipped').length,
        delivered: items.filter((i: any) => i.status === 'delivered').length,
        cancelled: items.filter((i: any) => i.status === 'cancelled').length,
        totalRevenue: items.reduce((sum: number, item: any) => sum + (item.price * item.quantity || 0), 0)
    }

    return stats
}
