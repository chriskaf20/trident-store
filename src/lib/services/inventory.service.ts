/**
 * Production Inventory Service
 * Aligned with Variant-Based SKU System
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { InventoryError, DatabaseError } from '@/lib/errors'

export interface InventoryResult {
    success: boolean
    error?: string
    code?: string
    message?: string
    [key: string]: any
}

/**
 * Reserve stock for a specific variant (Atomic RPC)
 */
export async function reserveVariantStock(
    variantId: string,
    quantity: number,
    notes?: string
): Promise<InventoryResult> {
    const supabase = await createAdminClient()

    const { data, error } = await supabase.rpc('reserve_variant_stock', {
        p_variant_id: variantId,
        p_quantity: quantity
    })

    if (error) {
        throw new DatabaseError(`Failed to reserve stock: ${error.message}`, { variantId, quantity })
    }

    if (!data.success) {
        throw new InventoryError(data.error, { code: data.code, variantId, quantity })
    }

    return data
}

/**
 * Finalize stock decrement after successful payment
 */
export async function decrementVariantStock(
    variantId: string,
    quantity: number,
    orderId?: string
): Promise<InventoryResult> {
    const supabase = await createAdminClient()

    const { data, error } = await supabase.rpc('decrement_variant_stock', {
        p_variant_id: variantId,
        p_quantity: quantity,
        p_order_id: orderId || null
    })

    if (error) {
        throw new DatabaseError(`Stock decrement failed: ${error.message}`, { variantId, quantity })
    }

    return data
}

/**
 * Get current stock availability
 */
export async function getVariantStockStatus(variantId: string) {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
        .from('product_variants')
        .select(`
            id,
            name,
            stock_quantity,
            reserved_quantity,
            products (
                name,
                vendors (name)
            )
        `)
        .eq('id', variantId)
        .single()

    if (error || !data) {
        throw new DatabaseError('Variant not found', { variantId })
    }

    const available = data.stock_quantity - data.reserved_quantity

    return {
        variantId: data.id,
        fullName: `${data.products.name} (${data.name})`,
        available,
        isLowStock: available < 5
    }
}
