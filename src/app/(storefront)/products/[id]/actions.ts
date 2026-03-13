'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitReview(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'You must be logged in to leave a review.' }
    }

    const productId = formData.get('productId') as string
    const rating = parseInt(formData.get('rating') as string)
    const comment = formData.get('comment') as string

    if (!productId || !rating || isNaN(rating) || rating < 1 || rating > 5) {
        return { error: 'Invalid review data.' }
    }

    // Check if user already reviewed this product
    const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .single()

    if (existingReview) {
        return { error: 'You have already reviewed this product.' }
    }

    // Insert review
    const { error: insertError } = await supabase
        .from('reviews')
        .insert([{
            product_id: productId,
            user_id: user.id,
            rating,
            comment: comment || null
        }])

    if (insertError) {
        console.error('Failed to submit review:', insertError)
        return { error: 'Failed to submit review. Please try again later.' }
    }

    revalidatePath(`/products/${productId}`)
    return { success: true }
}
