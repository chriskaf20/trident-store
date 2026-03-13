import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'

export default async function VendorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Role check (Defense-in-depth)
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'vendor') {
        redirect('/')
    }

    const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()

    // We don't redirect here anymore because the /dashboard page itself
    // handles the state where a user doesn't have a store yet and shows a
    // "Create Store Application" button. If we redirect to /dashboard here, it would
    // create a redirect loop if the user is already on /dashboard.

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden text-slate-900 dark:text-slate-100 font-sans">
            <Sidebar storeExists={!!store} storeName={store?.name} userEmail={user.email || 'vendor@example.com'} />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
