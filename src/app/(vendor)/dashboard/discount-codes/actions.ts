'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createDiscountCode(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: store } = await supabase.from('vendors').select('id').eq('owner_id', user.id).single()
    if (!store) return

    const code = (formData.get('code') as string)?.toUpperCase().trim()
    const discount_type = formData.get('discount_type') as string
    const discount_value = parseFloat(formData.get('discount_value') as string)
    const min_order_amount = parseFloat(formData.get('min_order_amount') as string) || 0
    const expires_at = formData.get('expires_at') as string
    const product_id = (formData.get('product_id') as string) || null

    if (!code || isNaN(discount_value)) return

    const { error } = await supabase.from('discount_codes').insert({
        vendor_id: store.id,
        code,
        discount_type,
        discount_value,
        min_order_amount,
        expires_at: expires_at || null,
        product_id: product_id || null,
        is_active: true,
    })

    if (error) {
        console.error('Failed to create discount code:', error.message)
        return { error: error.message }
    }

    revalidatePath('/dashboard/discount-codes')
    return { success: true }
}

export async function deleteDiscountCode(codeId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: store } = await supabase.from('vendors').select('id').eq('owner_id', user.id).single()
    if (!store) return { error: 'No store found' }

    const { error } = await supabase.from('discount_codes').delete().eq('id', codeId).eq('vendor_id', store.id)
    if (error) return { error: error.message }

    revalidatePath('/dashboard/discount-codes')
    return { success: true }
}
