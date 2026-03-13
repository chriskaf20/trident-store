'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const vendorApplySchema = z.object({
    storeName: z.string().min(2, "Store name must be at least 2 characters"),
    city: z.string().min(2, "City must be at least 2 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    instagram: z.string().optional(),
    whatsapp: z.string().min(8, "Valid WhatsApp number is required"),
})

export async function applyVendor(prevState: any, formData: FormData) {
    const supabase = await createClient()

    // 1. Check if user is logged in
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { error: 'You must be logged in to apply as a vendor.' }
    }

    // 2. Validate form data with Zod
    const validatedFields = vendorApplySchema.safeParse({
        storeName: formData.get('storeName'),
        city: formData.get('city'),
        description: formData.get('description'),
        instagram: formData.get('instagram'),
        whatsapp: formData.get('whatsapp'),
    })

    if (!validatedFields.success) {
        return { error: 'Invalid form data. Please check your inputs and try again.' }
    }

    const { storeName, city, description, instagram, whatsapp } = validatedFields.data

    // 3. Generate a rudimentary slug from store name
    const storeSlug = storeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')

    // 4. Check if they already applied
    const { data: existingApp } = await supabase
        .from('vendor_applications')
        .select('id, status')
        .eq('user_id', user.id)
        .single()

    if (existingApp) {
        return { error: 'You have already submitted a vendor application.' }
    }

    // 5. Fetch applicant profile info to store alongside application
    //    (avoids needing a JOIN on profiles later, which can fail with RLS)
    const { data: profile } = await supabase
        .from('profiles')
        .select('email')  // profiles has no full_name column
        .eq('id', user.id)
        .single()

    const userEmail = profile?.email || user.email || ''
    const derivedName = user.user_metadata?.full_name || userEmail.split('@')[0] || 'Unknown'

    // 6. Insert application with applicant info embedded
    const { error: insertError } = await supabase
        .from('vendor_applications')
        .insert([{
            user_id: user.id,
            store_name: storeName,
            store_slug: storeSlug,
            description,
            city,
            instagram: instagram || null,
            whatsapp,
            status: 'pending',
            applicant_name: derivedName,
            applicant_email: userEmail || null,
        }])

    if (insertError) {
        console.error('Failed to submit application:', insertError)
        return { error: 'Failed to submit application. Please try again later.' }
    }

    revalidatePath('/dashboard', 'layout')
    return { success: true }
}
