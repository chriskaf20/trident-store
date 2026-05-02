import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requireUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/auth/login')
    }
    return { supabase, user }
}

export async function requireRole(role: 'admin' | 'vendor') {
    const { supabase, user } = await requireUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        
    if (profile?.role !== role) {
        redirect('/')
    }
    return { supabase, user, profile }
}

export async function requireVendor() {
    return requireRole('vendor')
}

export async function requireAdmin() {
    return requireRole('admin')
}
