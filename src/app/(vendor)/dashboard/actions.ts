'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

export async function createStoreFromApplication() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()

    if (existingStore) redirect('/dashboard')

    const { data: app } = await supabase
        .from('vendor_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (!app) return { error: 'No application found.' }

    const baseSlug = (app.store_name || 'my_store')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`

    const { error: storeError } = await supabase.from('stores').insert([{
        owner_id: user.id,
        name: app.store_name || 'My Store',
        slug: uniqueSlug,
        description: app.description || 'Welcome to my store!',
        city: app.city || 'Unknown',
        whatsapp: app.whatsapp || '',
        instagram: app.instagram || ''
    }])

    if (storeError) return { error: 'Failed to create store: ' + storeError.message }

    revalidatePath('/dashboard')
    redirect('/dashboard')
}

const updateStoreSchema = z.object({
    name: z.string().min(2),
    description: z.string().min(10),
    city: z.string().min(2),
    whatsapp: z.string().min(8),
    instagram: z.string().optional(),
})

export async function updateStoreSettings(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const validatedFields = updateStoreSchema.safeParse({
        name: formData.get('name'),
        description: formData.get('description'),
        city: formData.get('city'),
        whatsapp: formData.get('whatsapp'),
        instagram: formData.get('instagram'),
    })

    if (!validatedFields.success) return

    await supabase
        .from('stores')
        .update(validatedFields.data)
        .eq('owner_id', user.id)

    revalidatePath('/dashboard/settings')
}

export async function createProduct(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()

    if (!store) return { error: 'Store not found.' }

    // ── Upload helper ────────────────────────────────────────────────────
    const uploadImage = async (file: File): Promise<string | null> => {
        if (!file || file.size === 0) return null
        const ext = file.name.split('.').pop()
        const path = `${store.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error } = await supabase.storage
            .from('products')
            .upload(path, file, { contentType: file.type, upsert: false })
        if (error) return null
        return supabase.storage.from('products').getPublicUrl(path).data.publicUrl
    }

    // ── Primary image (required) ─────────────────────────────────────────
    const primaryFile = formData.get('image') as File
    const imageUrl = await uploadImage(primaryFile)
    if (!imageUrl) return { error: 'Primary product image is required.' }

    // ── Extra images (optional, up to 7 more) ────────────────────────────
    const extraFiles = formData.getAll('images') as File[]
    const extraUrls: string[] = []
    for (const file of extraFiles) {
        if (file && file.size > 0) {
            const url = await uploadImage(file)
            if (url) extraUrls.push(url)
        }
    }

    // ── Scalar fields ────────────────────────────────────────────────────
    const name             = (formData.get('name') as string || '').trim()
    const description      = (formData.get('description') as string || '').trim()
    const category         = (formData.get('category') as string || '').trim()

    const price           = parseFloat(formData.get('price') as string)
    const originalPriceRaw = formData.get('original_price') as string
    const originalPrice   = originalPriceRaw ? parseFloat(originalPriceRaw) : null
    const stock           = parseInt(formData.get('stock') as string) || 0


    // ── JSON array fields ────────────────────────────────────────────────
    let sizes: string[] = []
    let colors: { name: string; hex: string }[] = []
    let tags: string[] = []
    try { sizes  = JSON.parse(formData.get('sizes') as string || '[]') } catch {}
    try { colors = JSON.parse(formData.get('colors') as string || '[]') } catch {}
    try { tags   = JSON.parse(formData.get('tags') as string || '[]') } catch {}

    // ── Validation ───────────────────────────────────────────────────────
    if (!name || name.length < 2) return { error: 'Product name is required.' }
    if (!price || price <= 0)     return { error: 'Valid price is required.' }

    // ── Insert ───────────────────────────────────────────────────────────
    const { error: insertError } = await supabase.from('products').insert([{
        store_id:          store.id,
        name,
        description,
        category,
        price,
        original_price:    originalPrice,
        stock,
        image:             imageUrl,
        images:            extraUrls.length > 0 ? extraUrls : null,
        sizes:             sizes.length > 0 ? sizes : null,
        colors:            colors.length > 0 ? colors : null,
        tags:              tags.length > 0 ? tags : null,
        currency:          'TL',
    }])

    if (insertError) {
        return { error: 'Failed to create product: ' + insertError.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard/products')
}

export async function deleteProduct(productId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()

    if (!store) return { error: 'Store not found.' }

    await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('store_id', store.id)

    revalidatePath('/', 'layout')
}
