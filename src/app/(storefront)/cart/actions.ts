'use server'

import { createClient } from '@/lib/supabase/server'

export async function validateDiscountCode(code: string, currentTotal: number) {
    if (!code) {
        return { error: 'Please enter a code.' }
    }

    const supabase = await createClient()

    const { data: discount, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single()

    if (error || !discount) {
        return { error: 'Invalid or expired discount code.' }
    }

    // Check expiration
    if (discount.valid_until && new Date(discount.valid_until) < new Date()) {
        return { error: 'This discount code has expired.' }
    }

    // Check usage limits
    if (discount.max_uses && discount.current_uses >= discount.max_uses) {
        return { error: 'This discount code has reached its usage limit.' }
    }

    // Check minimum purchase
    if (discount.min_purchase_amount && currentTotal < discount.min_purchase_amount) {
        return { error: `This code requires a minimum purchase of ${discount.min_purchase_amount} TL.` }
    }

    // Calculate savings
    let savings = 0
    if (discount.discount_type === 'percentage') {
        savings = currentTotal * (discount.discount_value / 100)
    } else if (discount.discount_type === 'fixed') {
        savings = discount.discount_value
    }

    return {
        success: true,
        discount: {
            id: discount.id,
            code: discount.code,
            type: discount.discount_type,
            value: discount.discount_value,
            savings: Math.min(savings, currentTotal) // Can't save more than the total
        }
    }
}
