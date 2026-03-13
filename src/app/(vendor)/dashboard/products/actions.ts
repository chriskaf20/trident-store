'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function deleteProduct(productId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: store } = await supabase.from('stores').select('id').eq('owner_id', user.id).single()
    if (!store) return { error: 'No store found' }

    const { error } = await supabase.from('products').delete().eq('id', productId).eq('store_id', store.id)
    if (error) return { error: error.message }

    revalidatePath('/dashboard/products')
    return { success: true }
}

export async function createProduct(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: store } = await supabase.from('stores').select('id').eq('owner_id', user.id).single()
    if (!store) return { error: 'You do not have an active store.' }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const originalPriceRaw = formData.get('original_price') as string
    const original_price = originalPriceRaw ? parseFloat(originalPriceRaw) : null
    const category = formData.get('category') as string
    const stock_quantity = parseInt(formData.get('stock_quantity') as string) || 0
    const imageUrl = formData.get('image_url') as string

    if (!name || isNaN(price)) return { error: 'Name and price are required.' }

    const productData: any = {
        store_id: store.id,
        name,
        description,
        price,
        original_price,
        category,
        stock_quantity,
        images: imageUrl ? [imageUrl] : [],
    }

    const { error } = await supabase.from('products').insert(productData)
    if (error) return { error: error.message }

    revalidatePath('/dashboard/products')
    redirect('/dashboard/products')
}
