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

export async function confirmReceipt(orderId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('You must be logged in')
    }

    // Update the parent order status
    const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', orderId)
        .eq('user_id', user.id)

    if (orderError) {
        throw new Error(orderError.message)
    }

    // Also update all items to delivered
    const { error: itemsError } = await supabase
        .from('order_items')
        .update({ status: 'delivered' })
        .eq('order_id', orderId)

    if (itemsError) {
        console.error('Failed to update order items status:', itemsError.message)
    }

    revalidatePath('/profile')
    return { success: true }
}
export async function cancelOrder(orderId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('You must be logged in')
    }

    // Only allow cancellation of pending orders
    const { data: order } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single()

    if (!order) {
        throw new Error('Order not found')
    }

    if (order.status !== 'pending') {
        throw new Error('Only pending orders can be cancelled')
    }

    const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .eq('user_id', user.id)

    if (orderError) {
        throw new Error(orderError.message)
    }

    // Also update all items to cancelled
    await supabase
        .from('order_items')
        .update({ status: 'cancelled' })
        .eq('order_id', orderId)

    revalidatePath('/profile')
    return { success: true }
}
