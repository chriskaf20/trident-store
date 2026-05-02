-- ============================================================
-- Migration 0033: Definitive RLS Consolidation
-- Runs AFTER 0031 and 0032. Final idempotent sweep.
--
-- Goals:
--   1. Eliminate ALL remaining "multiple permissive policies"
--      warnings on: stores, vendor_applications, wishlist
--   2. Add missing admin DELETE policy on vendor_applications
--   3. Fix inventory_logs SELECT policy (remove auth.role() usage)
--   4. Confirm RLS is ON for all affected tables
--   5. Drop every known historical policy name (from 0000–0032)
--      so the final state is exactly 1 policy per action per table
-- ============================================================


-- ============================================================
-- STORES
-- Root cause: 0007 created "Vendors can manage their store"
-- (FOR ALL = includes SELECT) alongside "Stores are publicly
-- viewable" (FOR SELECT) → two SELECT policies for the same table.
-- 0031/0032 fixed this, but we drop every known name to be safe.
-- ============================================================

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Drop every possible policy name from all prior migrations
DROP POLICY IF EXISTS "Enable read access for all users"    ON public.stores;
DROP POLICY IF EXISTS "Stores are publicly viewable"        ON public.stores;
DROP POLICY IF EXISTS "Vendors can manage their store"      ON public.stores;
DROP POLICY IF EXISTS "Admins can manage all stores"        ON public.stores;
DROP POLICY IF EXISTS "Vendors and admins can manage stores"   ON public.stores;
DROP POLICY IF EXISTS "Vendors and admins can insert stores"   ON public.stores;
DROP POLICY IF EXISTS "Vendors and admins can update stores"   ON public.stores;
DROP POLICY IF EXISTS "Vendors and admins can delete stores"   ON public.stores;

-- ── 1 SELECT policy (public read) ──────────────────────────────────────────
CREATE POLICY "Stores are publicly viewable" ON public.stores
    FOR SELECT USING (true);

-- ── INSERT: vendor creates their own store OR admin ─────────────────────────
CREATE POLICY "Vendors and admins can insert stores" ON public.stores
    FOR INSERT WITH CHECK (
        (SELECT auth.uid()) = stores.owner_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- ── UPDATE: vendor updates their own store OR admin ─────────────────────────
CREATE POLICY "Vendors and admins can update stores" ON public.stores
    FOR UPDATE USING (
        (SELECT auth.uid()) = stores.owner_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    )
    WITH CHECK (
        (SELECT auth.uid()) = stores.owner_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- ── DELETE: vendor deletes their own store OR admin ─────────────────────────
CREATE POLICY "Vendors and admins can delete stores" ON public.stores
    FOR DELETE USING (
        (SELECT auth.uid()) = stores.owner_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );


-- ============================================================
-- VENDOR_APPLICATIONS
-- Root cause: 0009 created two FOR SELECT policies:
--   "Users can view their own applications" and
--   "Admins can view all applications"
-- Also: no DELETE policy existed for admins at all.
-- ============================================================

ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;

-- Drop every possible policy name from all prior migrations
DROP POLICY IF EXISTS "Enable read access for all users"          ON public.vendor_applications;
DROP POLICY IF EXISTS "Users can view their own applications"     ON public.vendor_applications;
DROP POLICY IF EXISTS "Admins can view all applications"          ON public.vendor_applications;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.vendor_applications;
DROP POLICY IF EXISTS "Users can submit their own application"    ON public.vendor_applications;
DROP POLICY IF EXISTS "Admins can update application status"      ON public.vendor_applications;
DROP POLICY IF EXISTS "Admins can delete applications"            ON public.vendor_applications;
DROP POLICY IF EXISTS "Users and admins can view applications"    ON public.vendor_applications;

-- ── SELECT: own application OR admin ────────────────────────────────────────
-- (replaces 2 separate SELECT policies with 1 consolidated one)
CREATE POLICY "Users and admins can view applications" ON public.vendor_applications
    FOR SELECT USING (
        (SELECT auth.uid()) = vendor_applications.user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- ── INSERT: only the applicant themselves ────────────────────────────────────
CREATE POLICY "Users can submit their own application" ON public.vendor_applications
    FOR INSERT WITH CHECK (
        (SELECT auth.uid()) = vendor_applications.user_id
    );

-- ── UPDATE: admins only (approve / reject) ───────────────────────────────────
CREATE POLICY "Admins can update application status" ON public.vendor_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- ── DELETE: admins only [NEW — was missing in all prior migrations] ──────────
CREATE POLICY "Admins can delete applications" ON public.vendor_applications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );


-- ============================================================
-- WISHLIST
-- Root cause: 0007 created:
--   "Users can view their own wishlist"  (FOR SELECT)
--   "Users can manage their own wishlist" (FOR ALL → includes SELECT)
-- Two permissive SELECT policies on the same table.
-- ============================================================

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Drop every possible policy name from all prior migrations
DROP POLICY IF EXISTS "Enable read access for all users"    ON public.wishlist;
DROP POLICY IF EXISTS "Enable all for authenticated users"  ON public.wishlist;
DROP POLICY IF EXISTS "Users can view their own wishlist"   ON public.wishlist;
DROP POLICY IF EXISTS "Users can manage their own wishlist" ON public.wishlist;

-- ── Single FOR ALL policy (covers SELECT, INSERT, UPDATE, DELETE) ────────────
-- One policy, zero overlap, maximum clarity.
CREATE POLICY "Users can manage their own wishlist" ON public.wishlist
    FOR ALL
    USING (  (SELECT auth.uid()) = wishlist.user_id )
    WITH CHECK ( (SELECT auth.uid()) = wishlist.user_id );


-- ============================================================
-- INVENTORY_LOGS
-- Fix: replace auth.role() with proper (SELECT auth.uid()) pattern
-- and tighten access: vendors see their own store's logs,
-- admins see all.
-- ============================================================

ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inventory logs are viewable by authenticated users" ON public.inventory_logs;
DROP POLICY IF EXISTS "Vendors and admins can view inventory logs"         ON public.inventory_logs;

-- Vendors see logs for products in their store; admins see all
CREATE POLICY "Vendors and admins can view inventory logs" ON public.inventory_logs
    FOR SELECT USING (
        -- Admin: full access
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
        -- Vendor: only logs for products in their store
        OR EXISTS (
            SELECT 1 FROM public.products
            JOIN public.stores ON stores.id = products.store_id::uuid
            WHERE products.id = inventory_logs.product_id
              AND stores.owner_id = (SELECT auth.uid())
        )
    );


-- ============================================================
-- SANITY CHECK: Confirm RLS is ON for all tables touched above
-- (these are no-ops if already enabled, which they should be)
-- ============================================================

ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants     ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- VERIFICATION QUERY (run manually in SQL Editor after applying)
-- Expected: each tablename+cmd pair appears exactly ONCE
-- ============================================================
--
-- SELECT tablename, cmd, COUNT(*) AS policy_count
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'stores', 'vendor_applications', 'wishlist',
--     'profiles', 'products', 'orders', 'order_items',
--     'addresses', 'reviews', 'categories',
--     'discount_codes', 'product_variants', 'inventory_logs'
--   )
-- GROUP BY tablename, cmd
-- HAVING COUNT(*) > 1
-- ORDER BY tablename, cmd;
--
-- ✅ Zero rows = no duplicate permissive policies remaining.
-- ============================================================
