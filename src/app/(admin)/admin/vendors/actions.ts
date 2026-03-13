'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function approveVendorApplication(applicationId: string) {
    const supabase = await createClient()

    // Verify caller is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Unauthorized' }
    }

    // Fetch the application
    const { data: app, error: fetchError } = await supabase
        .from('vendor_applications')
        .select('*')
        .eq('id', applicationId)
        .single()

    if (fetchError || !app) {
        return { error: 'Application not found.' }
    }

    const baseSlug = (app.store_slug || app.store_name || 'store').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;

    // Create the store
    const { error: storeError } = await supabase
        .from('stores')
        .insert([{
            owner_id: app.user_id,
            name: app.store_name,
            slug: uniqueSlug,
            description: app.description,
            city: app.city,
            whatsapp: app.whatsapp,
            instagram: app.instagram,
        }])

    if (storeError) {
        console.error('Store creation error:', storeError)
        return { error: 'Failed to create store: ' + storeError.message }
    }

    // Update application status to approved
    await supabase
        .from('vendor_applications')
        .update({ status: 'approved' })
        .eq('id', applicationId)

    // Update user role to vendor using secure RPC
    const { error: roleError } = await supabase.rpc('admin_update_user_role', {
        target_user_id: app.user_id,
        new_role: 'vendor'
    })

    if (roleError) {
        console.error('Role update error:', roleError)
        return { error: 'Failed to update user role: ' + roleError.message }
    }

    revalidatePath('/admin/vendors')
    return { success: true }
}

export async function rejectVendorApplication(applicationId: string) {
    const supabase = await createClient()

    // Verify caller is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('vendor_applications')
        .update({ status: 'rejected' })
        .eq('id', applicationId)

    if (error) {
        return { error: 'Failed to reject application.' }
    }

    revalidatePath('/admin/vendors')
    return { success: true }
}
