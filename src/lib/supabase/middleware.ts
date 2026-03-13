import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    supabaseResponse = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    supabaseResponse.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    supabaseResponse = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    supabaseResponse.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    // Refresh session — IMPORTANT: do not remove this line
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const url = request.nextUrl.clone()
    const pathname = url.pathname

    // ─── Unauthenticated user: block protected routes ───────────────────────
    if (!user) {
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
            url.pathname = '/auth/login'
            return NextResponse.redirect(url)
        }
        return supabaseResponse
    }

    // ─── Authenticated user: fetch role for role-based guards ────────────────
    let userRole = 'customer'
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        userRole = profile?.role ?? 'customer'

        // Admin guard
        if (pathname.startsWith('/admin') && userRole !== 'admin') {
            url.pathname = '/'
            return NextResponse.redirect(url)
        }

        // Vendor guard
        if (pathname.startsWith('/dashboard') && userRole !== 'vendor') {
            url.pathname = '/vendor-apply'
            return NextResponse.redirect(url)
        }
    }

    // ─── Redirect logged-in users away from auth pages ───────────────────────
    if (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup')) {
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
