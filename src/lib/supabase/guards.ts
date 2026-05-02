/**
 * Authentication and Authorization Guards
 * Centralized logic for protecting server actions
 */

import { createClient } from '@/lib/supabase/server'
import { AuthenticationError, AuthorizationError } from '@/lib/errors'

/**
 * Require user to be authenticated
 * Throws AuthenticationError if not logged in
 */
export async function requireAuth() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new AuthenticationError('You must be logged in to perform this action', {
            supabaseError: error?.message,
        })
    }

    return user
}

/**
 * Require user to have a specific role
 * Returns user and profile data if authorized
 */
export async function requireRole(requiredRole: 'customer' | 'vendor' | 'admin') {
    const user = await requireAuth()
    const supabase = await createClient()

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (error || !profile) {
        throw new AuthenticationError('User profile not found', {
            userId: user.id,
            supabaseError: error?.message,
        })
    }

    if (profile.role !== requiredRole && profile.role !== 'admin') {
        throw new AuthorizationError(
            `This action requires ${requiredRole} access. Your current role is: ${profile.role}`,
            { requiredRole, actualRole: profile.role }
        )
    }

    return { user, profile }
}

/**
 * Require user to be a vendor
 * Admins are also allowed (they can act as vendors)
 */
export async function requireVendor() {
    const user = await requireAuth()
    const supabase = await createClient()

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (error || !profile) {
        throw new AuthenticationError('User profile not found', {
            userId: user.id,
        })
    }

    if (profile.role !== 'vendor' && profile.role !== 'admin') {
        throw new AuthorizationError(
            'This action requires vendor access. Apply to become a vendor.',
            { actualRole: profile.role }
        )
    }

    // Also fetch their vendor profile if they're a vendor
    const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()

    // If they are a vendor but haven't initialized their profile, don't throw an error here,
    // let them reach the EmptyStoreState component in the dashboard page where they can initialize it.
    // Wait, the original code DID throw an error here if they didn't have a store.
    // If we throw here, the layout will error out before they can see EmptyStoreState!
    // Ah, wait. The user reported the error: "Vendor profile exists but store not found. Please create a store first."
    // And Next.js stack trace showed this error happened in `VendorDashboardPage`.
    // Actually, `actions.ts` also uses `requireVendor` to create a store! If `requireVendor` throws when there's no store, how could they ever call `createStoreFromApplication`?
    // Let's remove the throw so they can initialize.

    return { user, profile, vendor: vendor || null, store: vendor || null }
}

/**
 * Require user to be an admin
 */
export async function requireAdmin() {
    const user = await requireAuth()
    const supabase = await createClient()

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (error || !profile) {
        throw new AuthenticationError('User profile not found', {
            userId: user.id,
        })
    }

    if (profile.role !== 'admin') {
        throw new AuthorizationError(
            'This action is only available to administrators.',
            { actualRole: profile.role }
        )
    }

    return { user, profile }
}

/**
 * Verify vendor owns a specific vendor profile
 */
export async function verifyStoreOwnership(vendorId: string) {
    const { user } = await requireVendor()
    const supabase = await createClient()

    const { data: vendor, error } = await supabase
        .from('vendors')
        .select('owner_id')
        .eq('id', vendorId)
        .single()

    if (error || !vendor) {
        throw new Error(`Vendor not found: ${vendorId}`)
    }

    if (vendor.owner_id !== user.id) {
        throw new AuthorizationError(
            'You do not have permission to manage this vendor profile',
            { vendorId, userId: user.id, ownerId: vendor.owner_id }
        )
    }

    return vendor
}

/**
 * Verify vendor owns a specific product
 */
export async function verifyProductOwnership(productId: string) {
    const { user } = await requireVendor()
    const supabase = await createClient()

    // Fetch product with its vendor
    const { data: product, error } = await supabase
        .from('products')
        .select('id, vendor_id')
        .eq('id', productId)
        .single()

    if (error || !product) {
        throw new Error(`Product not found: ${productId}`)
    }

    // Verify the product's vendor is owned by this user
    const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('owner_id')
        .eq('id', product.vendor_id)
        .single()

    if (vendorError || !vendor) {
        throw new Error(`Vendor not found for product: ${productId}`)
    }

    if (vendor.owner_id !== user.id) {
        throw new AuthorizationError(
            'You do not have permission to manage this product',
            { productId, userId: user.id, vendorId: product.vendor_id }
        )
    }

    return { product, vendor }
}
