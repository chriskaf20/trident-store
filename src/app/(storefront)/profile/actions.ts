'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('You must be logged in')
    }

    const phone_number = formData.get('phone_number') as string
    const gender = formData.get('gender') as string
    const avatar_emoji = formData.get('avatar_emoji') as string

    const { error } = await supabase
        .from('profiles')
        .update({
            phone_number: phone_number || null,
            gender: gender || null,
            avatar_emoji: avatar_emoji || '👤',
        })
        .eq('id', user.id)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/profile')
    return { success: true }
}

export async function addAddress(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('You must be logged in')
    }

    const street = formData.get('street') as string
    const apartment_door = formData.get('apartment_door') as string
    const phone_number = formData.get('phone_number') as string
    const map_location_link = formData.get('map_location_link') as string
    const is_default = formData.get('is_default') === 'on'

    const { error } = await supabase
        .from('addresses')
        .insert({
            user_id: user.id,
            street,
            apartment_door: apartment_door || null,
            phone_number: phone_number || null,
            map_location_link: map_location_link || null,
            is_default
        })

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/profile')
    return { success: true }
}

export async function updateAddress(id: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('You must be logged in')
    }

    const street = formData.get('street') as string
    const apartment_door = formData.get('apartment_door') as string
    const phone_number = formData.get('phone_number') as string
    const map_location_link = formData.get('map_location_link') as string
    const is_default = formData.get('is_default') === 'on'

    const { error } = await supabase
        .from('addresses')
        .update({
            street,
            apartment_door: apartment_door || null,
            phone_number: phone_number || null,
            map_location_link: map_location_link || null,
            is_default
        })
        .eq('id', id)
        .eq('user_id', user.id) // Ensure they own it

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/profile')
    return { success: true }
}

export async function deleteAddress(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('You must be logged in')
    }

    const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id) // Ensure they own it

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/profile')
    return { success: true }
}
