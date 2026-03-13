'use server'

import { createClient } from '@/lib/supabase/server'

export async function subscribeToNewsletter(prevState: any, formData: FormData) {
    const email = formData.get('email') as string

    if (!email) {
        return { error: 'Please enter a valid email address.' }
    }

    const supabase = await createClient()

    // Assuming the table `newsletter_subscribers` has a unique constraint on `email`
    const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email }])

    if (error) {
        // If it's a unique violation, we can just say "already subscribed" or just succeed silently
        if (error.code === '23505') {
            return { error: 'This email is already subscribed.' }
        }
        console.error('Newsletter subscription failed:', error)
        return { error: 'Failed to subscribe. Please try again later.' }
    }

    return { success: 'Thank you for subscribing!' }
}
