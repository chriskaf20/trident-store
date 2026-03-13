'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

export async function createStoreFromApplication() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Double check they don't already have one
    const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()
        
    if (existingStore) {
        redirect('/dashboard')
    }

    // Fetch their most recent application
    const { data: app } = await supabase
        .from('vendor_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (!app) {
        return { error: 'No application found to copy details from.' }
    }

    const baseSlug = (app.store_name || 'my_store').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;

    const { error: storeError } = await supabase.from('stores').insert([{
        owner_id: user.id,
        name: app.store_name || 'My Store',
        slug: uniqueSlug,
        description: app.description || 'Welcome to my store!',
        city: app.city || 'Unknown',
        whatsapp: app.whatsapp || '',
        instagram: app.instagram || ''
    }])

    if (storeError) {
        console.error('Store creation error:', storeError)
        return { error: 'Failed to create store: ' + storeError.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/vendor/dashboard')
    
    // Explicitly return success and then redirect in the next line or let the caller handle it.
    // Actually, redirecting here is better to ensure the UI refreshes completely.
    redirect('/dashboard')
}

const updateStoreSchema = z.object({
    name: z.string().min(2, "Store name must be at least 2 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    city: z.string().min(2, "City must be at least 2 characters"),
    whatsapp: z.string().min(8, "Valid WhatsApp number is required"),
    instagram: z.string().optional(),
})

export async function updateStoreSettings(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('Unauthorized')
        return
    }

    const validatedFields = updateStoreSchema.safeParse({
        name: formData.get('name'),
        description: formData.get('description'),
        city: formData.get('city'),
        whatsapp: formData.get('whatsapp'),
        instagram: formData.get('instagram'),
    })

    if (!validatedFields.success) {
        console.error('Invalid form data')
        return
    }

    const { error } = await supabase
        .from('stores')
        .update({
            name: validatedFields.data.name,
            description: validatedFields.data.description,
            city: validatedFields.data.city,
            whatsapp: validatedFields.data.whatsapp,
            instagram: validatedFields.data.instagram,
        })
        .eq('owner_id', user.id)

    if (error) {
        console.error('Update store error:', error)
        return
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings')
    
    return
}
