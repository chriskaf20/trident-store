-- =========================================================================================
-- MIGRATION: 0035_architectural_rebuild.sql
-- PURPOSE: Fixes all remaining Supabase Advisor Errors and Warnings, hardens security,
--          and standardizes architecture (UUID types and Foreign Keys).
-- =========================================================================================

-- =========================================================================================
-- PHASE 1: Architectural Cleanup - Enforce UUID Types and Foreign Keys
-- (Must be done first to allow policies to be updated correctly)
-- =========================================================================================

-- We must temporarily drop views/policies that depend on the TEXT type before altering.
DROP VIEW IF EXISTS public.low_stock_products;
DROP VIEW IF EXISTS public.products_with_stores;

-- Drop policies depending on products.store_id and orders.store_id
DROP POLICY IF EXISTS "Vendors can view their store orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors can update their store orders" ON public.orders;

DROP POLICY IF EXISTS "Vendors can insert their own products" ON public.products;
DROP POLICY IF EXISTS "Vendors can update their own products" ON public.products;
DROP POLICY IF EXISTS "Vendors can delete their own products" ON public.products;

DROP POLICY IF EXISTS "Vendors can view their store order items" ON public.order_items;

DROP POLICY IF EXISTS "Vendors and admins can view inventory logs" ON public.inventory_logs;

-- Also drop product_variants policies that might be checking products.store_id
DROP POLICY IF EXISTS "Vendors can manage their product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Vendors/* */can/* */manage/* */their/* */product/* */variants" ON public.product_variants;
DROP POLICY IF EXISTS "Vendors can insert product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Vendors can update product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Vendors can delete product variants" ON public.product_variants;

-- 1A: Convert TEXT store_id to UUID
ALTER TABLE public.products ALTER COLUMN store_id TYPE UUID USING store_id::uuid;
ALTER TABLE public.orders ALTER COLUMN store_id TYPE UUID USING store_id::uuid;

-- 1B: Add strictly enforced Foreign Keys
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_store_id_fkey;
ALTER TABLE public.products 
  ADD CONSTRAINT products_store_id_fkey 
  FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_store_id_fkey;
ALTER TABLE public.orders 
  ADD CONSTRAINT orders_store_id_fkey 
  FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

-- 1C: Recreate Views and Policies using proper UUID joins (No Casts)
CREATE VIEW public.low_stock_products WITH (security_invoker = true) AS
SELECT 
  p.id, p.name, p.stock,
  COALESCE(p.reserved_quantity, 0) AS reserved_quantity,
  p.stock - COALESCE(p.reserved_quantity, 0) AS available_stock,
  s.owner_id, s.name AS store_name, s.id AS store_id
FROM public.products p
JOIN public.stores s ON s.id = p.store_id
WHERE (p.stock - COALESCE(p.reserved_quantity, 0)) < 5 AND p.stock >= 0;

CREATE POLICY "Vendors can view their store orders" ON public.orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = orders.store_id AND stores.owner_id = (SELECT auth.uid()))
  );

CREATE POLICY "Vendors can update their store orders" ON public.orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = orders.store_id AND stores.owner_id = (SELECT auth.uid()))
  );

CREATE POLICY "Vendors can insert their own products" ON public.products
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = products.store_id AND stores.owner_id = (SELECT auth.uid()))
  );

CREATE POLICY "Vendors can update their own products" ON public.products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = products.store_id AND stores.owner_id = (SELECT auth.uid()))
  );

CREATE POLICY "Vendors can delete their own products" ON public.products
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = products.store_id AND stores.owner_id = (SELECT auth.uid()))
  );

CREATE POLICY "Vendors can view their store order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      JOIN public.stores ON stores.id = orders.store_id
      WHERE orders.id = order_items.order_id
        AND stores.owner_id = (SELECT auth.uid())
    )
  );

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
            JOIN public.stores ON stores.id = products.store_id
            WHERE products.id = inventory_logs.product_id
              AND stores.owner_id = (SELECT auth.uid())
        )
    );

CREATE VIEW public.products_with_stores WITH (security_invoker = true) AS
SELECT
    p.id,
    p.store_id,
    p.name,
    p.slug,
    p.description,
    p.price,
    p.original_price,
    p.category,
    p.stock,
    p.image,
    p.images,
    p.sizes,
    p.colors,
    p.tags,
    p.is_trending,
    COALESCE((
        SELECT AVG(rating::numeric)
        FROM public.reviews
        WHERE product_id = p.id::text
    ), 0) AS rating,
    p.created_at,
    s.name AS store_name,
    s.slug AS store_slug
FROM public.products p
LEFT JOIN public.stores s ON p.store_id = s.id;

-- =========================================================================================
-- PHASE 2: Fix Multiple Permissive Policies (Performance Warning)
-- =========================================================================================

-- 2A: Categories
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admins/* */can/* */manage/* */categories" ON public.categories;
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE USING (public.is_admin());

-- 2B: Payments
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Customers can view own payments" ON public.payments;

CREATE POLICY "Admins can insert payments" ON public.payments FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update payments" ON public.payments FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete payments" ON public.payments FOR DELETE USING (public.is_admin());

CREATE POLICY "Users can view relevant payments" ON public.payments
  FOR SELECT USING (
    public.is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
        AND orders.user_id = (SELECT auth.uid())
    )
  );

-- 2C: Product Variants
-- Vendor policies recreated here without the text casts.
CREATE POLICY "Vendors can insert product variants" ON public.product_variants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      JOIN public.stores ON stores.id = products.store_id
      WHERE products.id = product_variants.product_id
        AND stores.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Vendors can update product variants" ON public.product_variants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.products
      JOIN public.stores ON stores.id = products.store_id
      WHERE products.id = product_variants.product_id
        AND stores.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Vendors can delete product variants" ON public.product_variants
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.products
      JOIN public.stores ON stores.id = products.store_id
      WHERE products.id = product_variants.product_id
        AND stores.owner_id = (SELECT auth.uid())
    )
  );

-- =========================================================================================
-- PHASE 3: Fix Security Definer Views (Error)
-- =========================================================================================

-- low_stock_products was already recreated securely in Phase 1.
DROP VIEW IF EXISTS public.test_view;

-- =========================================================================================
-- PHASE 4: Fix Mutable Search Path (Warning)
-- =========================================================================================

CREATE OR REPLACE FUNCTION public.increment_discount_usage(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE public.discount_codes
  SET current_uses = current_uses + 1
  WHERE code = UPPER(p_code)
    AND is_active = true
    AND (valid_until IS NULL OR valid_until >= now())
    AND (max_uses IS NULL OR current_uses < max_uses);
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- =========================================================================================
-- PHASE 5: Fix Public Bucket Directory Listing (Warning)
-- =========================================================================================

DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Profile pictures are publicly accessible" ON storage.objects;

-- =========================================================================================
-- PHASE 6: Hardening SECURITY DEFINER RPCs (Warning)
-- =========================================================================================

REVOKE EXECUTE ON FUNCTION public.admin_update_user_role(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.approve_vendor_application(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_stock_reservation(uuid, integer, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.decrement_product_stock(uuid, integer, uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_category_counts() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_discount_usage(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.refund_product_stock(uuid, integer, uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_vendor_application(uuid, uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reserve_product_stock(uuid, integer, text) FROM PUBLIC, anon;

-- =========================================================================================
-- PHASE 7: Add Missing Foreign Key Indexes (Performance)
-- =========================================================================================

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_by ON public.inventory_logs(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

-- =========================================================================================
-- PHASE 8: Fix Profiles Data Leak (Security)
-- =========================================================================================

DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: public fields viewable" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = (SELECT auth.uid()));

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());
