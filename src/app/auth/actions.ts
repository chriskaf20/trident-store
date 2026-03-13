'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Email and password are required' }
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    // Role-based routing (Intelligent Redirect)
    let destinationPath = '/'

    if (authData?.user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authData.user.id)
            .single()

        if (profile) {
            if (profile.role === 'admin') {
                destinationPath = '/admin'
            } else if (profile.role === 'vendor') {
                destinationPath = '/dashboard'
            }
        }
    }

    revalidatePath('/', 'layout')
    redirect(destinationPath)
}

export async function signup(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Email and password are required' }
    }

    if (password.length < 6) {
        return { error: 'Password must be at least 6 characters' }
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
            {
                id: data.user.id,
                email: data.user.email,
                role: 'customer'
            }
        ])

        if (profileError) {
            console.error('Error creating profile:', profileError)
            // Even if profile fails, user auth is created, but log error
        }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}
