'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleWishlist(productId: string, currentPath: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'You must be logged in to save items to your wishlist.' }
    }

    // Check if it's already in the wishlist
    const { data: existing } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single()

    if (existing) {
        // Remove from wishlist
        const { error } = await supabase
            .from('wishlist')
            .delete()
            .eq('id', existing.id)

        if (error) {
            return { error: 'Failed to remove from wishlist.' }
        }
    } else {
        // Add to wishlist
        const { error } = await supabase
            .from('wishlist')
            .insert([{
                user_id: user.id,
                product_id: productId
            }])

        if (error) {
            return { error: 'Failed to add to wishlist.' }
        }
    }

    revalidatePath(currentPath)
    return { success: true }
}

export async function removeFromWishlist(wishlistId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized.' }
    }

    const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', wishlistId)
        .eq('user_id', user.id) // Security check

    if (error) {
        return { error: 'Failed to remove from wishlist.' }
    }

    revalidatePath('/wishlist')
    return { success: true }
}
