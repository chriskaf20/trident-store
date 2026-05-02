/**
 * Admin Order Management Actions
 * System-wide order management and admin operations
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/supabase/guards'
import { ValidationError, NotFoundError } from '@/lib/errors'

/**
 * Get all orders (admin view)
 * With pagination and filtering
 */
export async function getAdminOrders(
    status?: string,
    storeId?: string,
    limit: number = 50,
    offset: number = 0
) {
    await requireAdmin()
    const supabase = await createClient()

    let query = supabase
        .from('orders')
        .select(
            `
            *,
            profiles (
                email,
                full_name
            ),
            order_items (
                id,
                product_name,
                quantity,
                price,
                store_id,
                status,
                tracking_number
            )
            `,
            { count: 'exact' }
        )
        .order('created_at', { ascending: false })

    if (status) {
        query = query.eq('status', status)
    }

    if (storeId) {
        const { data: storeOrders } = await supabase
            .from('order_items')
            .select('order_id')
            .eq('store_id', storeId)
        
        const orderIds = storeOrders?.map(i => i.order_id) || []
        
        if (orderIds.length === 0) {
            return { orders: [], total: 0, limit, offset }
        }
        
        query = query.in('id', orderIds)
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
        throw new Error(`Failed to fetch orders: ${error.message}`)
    }

    return {
        orders: data || [],
        total: count || 0,
        limit,
        offset
    }
}

/**
 * Get a single order with full details
 */
export async function getAdminOrderDetail(orderId: string) {
    await requireAdmin()
    const supabase = await createClient()

    const { data: order, error } = await supabase
        .from('orders')
        .select(
            `
            *,
            profiles (
                id,
                email,
                full_name,
                phone_number,
                avatar_emoji
            ),
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
            )
            `
        )
        .eq('id', orderId)
        .single()

    if (error || !order) {
        throw new NotFoundError('Order')
    }

    return order
}

/**
 * Update overall order status
 * (can also affect all line items)
 */
export async function updateOrderStatus(
    orderId: string,
    newStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
) {
    await requireAdmin()
    const supabase = await createClient()

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(newStatus)) {
        throw new ValidationError(`Invalid status: ${newStatus}`)
    }

    // Fetch current order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single()

    if (orderError || !order) {
        throw new NotFoundError('Order')
    }

    // Update order status
    const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

    if (updateError) {
        throw new Error(`Failed to update order: ${updateError.message}`)
    }

    // Optionally update all related items to match (for consistency)
    // Only if transitioning to a "final" state
    if (['delivered', 'cancelled'].includes(newStatus)) {
        await supabase
            .from('order_items')
            .update({ status: newStatus })
            .eq('order_id', orderId)
            .neq('status', 'cancelled') // Don't override already-cancelled items
    }

    revalidatePath('/admin/transactions')

    return { success: true, orderId, newStatus }
}

/**
 * Refund an entire order
 * Cancels all items and marks order as cancelled
 */
export async function refundOrder(orderId: string, reason: string) {
    await requireAdmin()
    const supabase = await createClient()

    if (!reason || reason.trim().length === 0) {
        throw new ValidationError('Refund reason is required')
    }

    // Fetch order with items
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(
            `
            *,
            order_items (
                id,
                product_id,
                quantity,
                store_id
            )
            `
        )
        .eq('id', orderId)
        .single()

    if (orderError || !order) {
        throw new NotFoundError('Order')
    }

    // Cancel all order items
    const { error: itemsError } = await supabase
        .from('order_items')
        .update({ status: 'cancelled' })
        .eq('order_id', orderId)

    if (itemsError) {
        throw new Error(`Failed to cancel order items: ${itemsError.message}`)
    }

    // Cancel the order
    const { error: cancelError } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)

    if (cancelError) {
        throw new Error(`Failed to cancel order: ${cancelError.message}`)
    }

    // Restore inventory
    const { refundProductStock } = await import('@/lib/services/inventory.service')
    for (const item of order.order_items) {
        try {
            await refundProductStock(item.product_id, item.quantity, orderId, `Refund: ${reason}`)
        } catch (e) {
            console.error('Failed to restore stock for item', item.id, e)
            // Non-blocking error
        }
    }

    // TODO: Process refund to payment method (when payment system is implemented)
    // TODO: Send refund confirmation email

    revalidatePath(`/admin/transactions/${orderId}`)

    return { 
        success: true, 
        orderId, 
        message: `Order refunded: ${reason}` 
    }
}

/**
 * Mark order as resolved (admin)
 * Used when customer dispute/issue is resolved
 */
export async function markOrderResolved(orderId: string, resolution: string) {
    await requireAdmin()
    const supabase = await createClient()

    if (!resolution || resolution.trim().length === 0) {
        throw new ValidationError('Resolution details required')
    }

    const { error } = await supabase
        .from('orders')
        .update({ 
            status: 'delivered',
            admin_notes: resolution
        })
        .eq('id', orderId)

    if (error) {
        throw new Error(`Failed to resolve order: ${error.message}`)
    }

    // TODO: Send resolution email to customer

    revalidatePath(`/admin/transactions/${orderId}`)

    return { success: true, orderId, resolution }
}

/**
 * Get order revenue analytics for admin dashboard
 */
export async function getOrderAnalytics(startDate?: Date, endDate?: Date) {
    await requireAdmin()
    const supabase = await createClient()

    let query = supabase
        .from('orders')
        .select('status, total_amount, created_at')

    // Optional date filtering
    if (startDate) {
        query = query.gte('created_at', startDate.toISOString())
    }
    if (endDate) {
        query = query.lte('created_at', endDate.toISOString())
    }

    const { data: orders, error } = await query

    if (error) {
        throw new Error(`Failed to fetch analytics: ${error.message}`)
    }

    if (!orders || orders.length === 0) {
        return {
            totalRevenue: 0,
            totalOrders: 0,
            avgOrderValue: 0,
            byStatus: {}
        }
    }

    // Calculate analytics
    const totalRevenue = orders.reduce((sum: number, order: any) => 
        sum + (order.total_amount || 0), 0
    )
    const totalOrders = orders.length
    const avgOrderValue = totalRevenue / totalOrders

    // Group by status
    const byStatus: Record<string, number> = {}
    orders.forEach((order: any) => {
        byStatus[order.status] = (byStatus[order.status] || 0) + 1
    })

    return {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        byStatus
    }
}

/**
 * Batch update order items status
 * For bulk operations (e.g., mark all pending items from vendor as shipped)
 */
export async function batchUpdateOrderItems(
    itemIds: string[],
    newStatus: string,
    trackingNumber?: string
) {
    await requireAdmin()
    const supabase = await createClient()

    if (itemIds.length === 0) {
        throw new ValidationError('No items provided')
    }

    const updateData: any = { status: newStatus }
    if (trackingNumber) {
        updateData.tracking_number = trackingNumber
    }

    const { error } = await supabase
        .from('order_items')
        .update(updateData)
        .in('id', itemIds)

    if (error) {
        throw new Error(`Failed to update items: ${error.message}`)
    }

    revalidatePath('/admin/transactions')

    return { 
        success: true, 
        updatedCount: itemIds.length,
        newStatus 
    }
}
