'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/supabase/guards'

export async function toggleProductTrending(
    productId: string,
    currentTrending: boolean
): Promise<void> {
    await requireAdmin()
    const supabase = await createClient()

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
