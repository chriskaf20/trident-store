'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleProductTrending(
    productId: string,
    currentTrending: boolean
): Promise<void> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        throw new Error('Forbidden')
    }

    const { error } = await supabase
        .from('products')
        .update({ is_trending: !currentTrending })
        .eq('id', productId)

    if (error) {
        console.error('Failed to update trending status', error)
        throw new Error(error.message)
    }

    revalidatePath('/admin/products')
    revalidatePath('/', 'layout')
}
