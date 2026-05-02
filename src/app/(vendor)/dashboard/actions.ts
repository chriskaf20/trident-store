'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { productSchema } from '@/lib/schemas'
import { requireVendor } from '@/lib/supabase/guards'

export async function createStoreFromApplication() {
    const { user } = await requireVendor()
    const supabase = await createClient()

    const { data: existingVendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()

    if (existingVendor) redirect('/dashboard')

    const baseSlug = 'my-store'
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`

    const { error: vendorError } = await supabase.from('vendors').insert([{
        owner_id: user.id,
        name: 'My Store',
        slug: uniqueSlug,
        description: 'Welcome to my store!',
    }])

    if (vendorError) return { error: 'Failed to create vendor profile: ' + vendorError.message }

    revalidatePath('/dashboard')
    redirect('/dashboard')
}

const updateVendorSchema = z.object({
    name: z.string().min(2),
    description: z.string().min(10),
})

export async function updateStoreSettings(formData: FormData) {
    const { user } = await requireVendor()
    const supabase = await createClient()

    const validatedFields = updateVendorSchema.safeParse({
        name: formData.get('name'),
        description: formData.get('description'),
    })

    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0].message }
    }

    await supabase
        .from('vendors')
        .update(validatedFields.data)
        .eq('owner_id', user.id)

    revalidatePath('/dashboard/settings')
}

export async function createProduct(prevState: any, formData: FormData) {
    const { user } = await requireVendor()
    const supabase = await createClient()

    const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()

    if (!vendor) return { error: 'Vendor profile not found.' }

    // ── Upload helper ────────────────────────────────────────────────────
    const uploadImage = async (file: File): Promise<string | null> => {
        if (!file || file.size === 0) return null
        const ext = file.name.split('.').pop()
        const path = `${vendor.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error } = await supabase.storage
            .from('products')
            .upload(path, file, { contentType: file.type, upsert: false })
        if (error) return null
        return supabase.storage.from('products').getPublicUrl(path).data.publicUrl
    }

    // ── Images ─────────────────────────────────────────
    const imageFiles = formData.getAll('images') as File[]
    const uploadPromises = imageFiles
        .filter(file => file && file.size > 0)
        .map(file => uploadImage(file))
    
    const imageUrls = (await Promise.all(uploadPromises)).filter(Boolean) as string[]
    const primaryImageUrl = imageUrls.length > 0 ? imageUrls[0] : null

    // ── JSON fields ────────────────────────────────────────────────
    let variants: any[] = []
    try { variants = JSON.parse(formData.get('variants') as string || '[]') } catch {}

    // ── Validation ───────────────────────────────────────────────────────
    const validatedFields = productSchema.safeParse({
        name: formData.get('name'),
        description: formData.get('description'),
        category_id: formData.get('category_id') || null,
        variants,
    })

    if (!validatedFields.success) {
        return { error: 'Validation failed: ' + validatedFields.error.issues[0].message }
    }

    const { name, description, category_id, variants: validatedVariants } = validatedFields.data

    const baseSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`

    // ── Insert Product ───────────────────────────────────────────────────────────
    const { data: product, error: insertError } = await supabase.from('products').insert([{
        vendor_id: vendor.id,
        name,
        slug,
        description,
        category_id,
        status: 'active',
    }]).select('id').single()

    if (insertError || !product) {
        return { error: 'Failed to create product: ' + insertError?.message }
    }

    // ── Insert Variants ───────────────────────────────────────────────────────────
    const variantInserts = validatedVariants.map(v => ({
        product_id: product.id,
        name: v.name,
        sku: v.sku || `${slug}-${v.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`,
        price: v.price,
        stock_quantity: v.stock_quantity,
        image_url: primaryImageUrl // For simplicity, we assign the primary image to all variants initially
    }))

    const { error: variantError } = await supabase.from('product_variants').insert(variantInserts)

    if (variantError) {
        return { error: 'Failed to create product variants: ' + variantError.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard/products')
}

export async function deleteProduct(productId: string) {
    const { user } = await requireVendor()
    const supabase = await createClient()

    const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()

    if (!vendor) return { error: 'Vendor profile not found.' }

    await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('vendor_id', vendor.id)

    revalidatePath('/', 'layout')
}
