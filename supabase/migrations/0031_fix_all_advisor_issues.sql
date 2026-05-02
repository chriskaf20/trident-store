-- ============================================================
-- Migration 0031: Fix All Supabase Advisor Issues
-- Fixes:
--   ERRORS:   security_definer_view (2 views)
--   WARNINGS: function_search_path_mutable (5 functions)
--             public_bucket_allows_listing (2 buckets)
--             auth_rls_initplan (27 policies)
--             multiple_permissive_policies (7 tables)
--   INFO:     rls_enabled_no_policy (3 tables)
--             unindexed_foreign_keys (10+ FK columns)
-- ============================================================


-- ============================================================
-- PART 1: Fix SECURITY DEFINER views → SECURITY INVOKER
-- ============================================================

-- Drop and recreate low_stock_products without SECURITY DEFINER
-- (In PG15+ we use security_invoker=true option)
DROP VIEW IF EXISTS public.low_stock_products;
CREATE VIEW public.low_stock_products
WITH (security_invoker = true)
AS
SELECT
    p.id,
    p.name,
    p.store_id,
    s.owner_id,
    s.name AS store_name,
    p.stock AS stock_quantity,
    p.reserved_quantity,
    (p.stock - p.reserved_quantity) AS available_quantity
FROM public.products p
LEFT JOIN public.stores s ON p.store_id::uuid = s.id
WHERE (p.stock - p.reserved_quantity) < 5
    AND p.is_active = true;

-- Drop and recreate products_with_stores without SECURITY DEFINER
DROP VIEW IF EXISTS public.products_with_stores;
CREATE VIEW public.products_with_stores
WITH (security_invoker = true)
AS
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
LEFT JOIN public.stores s ON p.store_id::uuid = s.id;


-- ============================================================
-- PART 2: Fix mutable search_path on 5 functions
-- (Add SET search_path = public to each)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_category_counts()
RETURNS TABLE (category TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT products.category::TEXT, COUNT(*) AS count
    FROM public.products
    WHERE products.category IS NOT NULL
    GROUP BY products.category;
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_product_stock(
    p_product_id UUID,
    p_quantity INT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_stock INT;
    v_current_reserved INT;
    v_available INT;
BEGIN
    SELECT stock, reserved_quantity
    INTO v_current_stock, v_current_reserved
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Product not found', 'code', 'PRODUCT_NOT_FOUND');
    END IF;

    v_available := v_current_stock - v_current_reserved;

    IF v_available < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Insufficient stock. Available: %s, Requested: %s', v_available, p_quantity),
            'code', 'INSUFFICIENT_STOCK',
            'available', v_available,
            'requested', p_quantity
        );
    END IF;

    UPDATE public.products
    SET reserved_quantity = reserved_quantity + p_quantity
    WHERE id = p_product_id;

    INSERT INTO public.inventory_logs (
        product_id, action, quantity, quantity_before, quantity_after,
        reserved_before, reserved_after, notes
    ) VALUES (
        p_product_id, 'reserve', p_quantity, v_current_stock, v_current_stock,
        v_current_reserved, v_current_reserved + p_quantity, p_notes
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Stock reserved successfully',
        'product_id', p_product_id,
        'reserved_quantity', p_quantity,
        'remaining_available', v_available - p_quantity
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_product_stock(
    p_product_id UUID,
    p_quantity INT,
    p_order_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_stock INT;
    v_current_reserved INT;
BEGIN
    SELECT stock, reserved_quantity
    INTO v_current_stock, v_current_reserved
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Product not found', 'code', 'PRODUCT_NOT_FOUND');
    END IF;

    IF v_current_stock < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Insufficient stock. Available: %s, Requested: %s', v_current_stock, p_quantity),
            'code', 'INSUFFICIENT_STOCK',
            'available', v_current_stock,
            'requested', p_quantity
        );
    END IF;

    UPDATE public.products
    SET
        stock = stock - p_quantity,
        reserved_quantity = GREATEST(0, reserved_quantity - p_quantity)
    WHERE id = p_product_id;

    INSERT INTO public.inventory_logs (
        product_id, order_id, action, quantity, quantity_before, quantity_after,
        reserved_before, reserved_after, notes
    ) VALUES (
        p_product_id, p_order_id, 'decrement', p_quantity, v_current_stock, v_current_stock - p_quantity,
        v_current_reserved, GREATEST(0, v_current_reserved - p_quantity), p_notes
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Stock decremented successfully',
        'product_id', p_product_id,
        'decremented', p_quantity,
        'remaining_stock', v_current_stock - p_quantity,
        'order_id', p_order_id
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_stock_reservation(
    p_product_id UUID,
    p_quantity INT,
    p_order_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_stock INT;
    v_current_reserved INT;
BEGIN
    SELECT stock, reserved_quantity
    INTO v_current_stock, v_current_reserved
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Product not found');
    END IF;

    IF v_current_reserved < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Cannot cancel %s units. Only %s reserved', p_quantity, v_current_reserved)
        );
    END IF;

    UPDATE public.products
    SET reserved_quantity = reserved_quantity - p_quantity
    WHERE id = p_product_id;

    INSERT INTO public.inventory_logs (
        product_id, order_id, action, quantity, quantity_before, quantity_after,
        reserved_before, reserved_after
    ) VALUES (
        p_product_id, p_order_id, 'cancel_reservation', p_quantity, v_current_stock, v_current_stock,
        v_current_reserved, v_current_reserved - p_quantity
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Reservation cancelled',
        'product_id', p_product_id,
        'cancelled_quantity', p_quantity
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_product_stock(
    p_product_id UUID,
    p_quantity INT,
    p_order_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_stock INT;
BEGIN
    SELECT stock
    INTO v_current_stock
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Product not found');
    END IF;

    UPDATE public.products
    SET stock = stock + p_quantity
    WHERE id = p_product_id;

    INSERT INTO public.inventory_logs (
        product_id, order_id, action, quantity, quantity_before, quantity_after, notes
    ) VALUES (
        p_product_id, p_order_id, 'refund', p_quantity, v_current_stock, v_current_stock + p_quantity, p_notes
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Stock refunded successfully',
        'product_id', p_product_id,
        'refunded_quantity', p_quantity,
        'new_stock', v_current_stock + p_quantity
    );
END;
$$;


-- ============================================================
-- PART 3: Add RLS policies to tables that have none
-- ============================================================

-- categories: public read, admin write
DROP POLICY IF EXISTS "Categories are publicly viewable" ON public.categories;
CREATE POLICY "Categories are publicly viewable" ON public.categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin')
    );

-- inventory_logs: authenticated users can view; system writes via SECURITY DEFINER functions
DROP POLICY IF EXISTS "Inventory logs are viewable by authenticated users" ON public.inventory_logs;
CREATE POLICY "Inventory logs are viewable by authenticated users" ON public.inventory_logs
    FOR SELECT USING ((SELECT auth.role()) = 'authenticated');

-- product_variants: public read, vendors can manage their store's variants
DROP POLICY IF EXISTS "Product variants are publicly viewable" ON public.product_variants;
CREATE POLICY "Product variants are publicly viewable" ON public.product_variants
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Vendors can manage their product variants" ON public.product_variants;
CREATE POLICY "Vendors can manage their product variants" ON public.product_variants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.products
            JOIN public.stores ON stores.id = products.store_id::uuid
            WHERE products.id = product_variants.product_id
              AND stores.owner_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.products
            JOIN public.stores ON stores.id = products.store_id::uuid
            WHERE products.id = product_variants.product_id
              AND stores.owner_id = (SELECT auth.uid())
        )
    );


-- ============================================================
-- PART 4: Fix auth_rls_initplan — wrap auth.uid() in (SELECT ...)
--         AND consolidate multiple permissive policies
--
-- Strategy per table:
--   - DROP all existing policies for the affected actions
--   - CREATE one consolidated policy per action using OR
-- ============================================================

-- ---- profiles ----
DROP POLICY IF EXISTS "Profiles are publicly viewable"     ON public.profiles;
DROP POLICY IF EXISTS "Admins can view any profile"        ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile"      ON public.profiles;

-- Consolidated SELECT: public + admins can see all (public already covers admins)
CREATE POLICY "Profiles are publicly viewable" ON public.profiles
    FOR SELECT USING (true);

-- INSERT: only the user themselves
CREATE POLICY "Enable insert for authenticated users only" ON public.profiles
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

-- Consolidated UPDATE: own profile OR admin
CREATE POLICY "Users and admins can update profiles" ON public.profiles
    FOR UPDATE USING (
        (SELECT auth.uid()) = profiles.id
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin')
    )
    WITH CHECK (
        (SELECT auth.uid()) = profiles.id
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin')
    );


-- ---- vendor_applications ----
DROP POLICY IF EXISTS "Users can view their own applications"      ON public.vendor_applications;
DROP POLICY IF EXISTS "Admins can view all applications"           ON public.vendor_applications;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.vendor_applications;
DROP POLICY IF EXISTS "Users can submit their own application"     ON public.vendor_applications;
DROP POLICY IF EXISTS "Admins can update application status"       ON public.vendor_applications;

-- Consolidated SELECT: own OR admin
CREATE POLICY "Users and admins can view applications" ON public.vendor_applications
    FOR SELECT USING (
        (SELECT auth.uid()) = vendor_applications.user_id
        OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin')
    );

-- Consolidated INSERT: only the user themselves (drop the generic "authenticated" one)
CREATE POLICY "Users can submit their own application" ON public.vendor_applications
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = vendor_applications.user_id);

-- UPDATE: admins only
CREATE POLICY "Admins can update application status" ON public.vendor_applications
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin')
    );


-- ---- stores ----
DROP POLICY IF EXISTS "Stores are publicly viewable"   ON public.stores;
DROP POLICY IF EXISTS "Vendors can manage their store" ON public.stores;
DROP POLICY IF EXISTS "Admins can manage all stores"   ON public.stores;

-- SELECT: public
CREATE POLICY "Stores are publicly viewable" ON public.stores
    FOR SELECT USING (true);

-- Consolidated INSERT/UPDATE/DELETE: vendor owns the store OR admin
CREATE POLICY "Vendors and admins can manage stores" ON public.stores
    FOR ALL USING (
        (SELECT auth.uid()) = stores.owner_id
        OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin')
    )
    WITH CHECK (
        (SELECT auth.uid()) = stores.owner_id
        OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin')
    );


-- ---- products ----
DROP POLICY IF EXISTS "Products are viewable by everyone"     ON public.products;
DROP POLICY IF EXISTS "Vendors can insert their own products" ON public.products;
DROP POLICY IF EXISTS "Vendors can update their own products" ON public.products;
DROP POLICY IF EXISTS "Vendors can delete their own products" ON public.products;

CREATE POLICY "Products are viewable by everyone" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Vendors can insert their own products" ON public.products
    FOR INSERT WITH CHECK (
        products.store_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = products.store_id::uuid
              AND stores.owner_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Vendors can update their own products" ON public.products
    FOR UPDATE USING (
        products.store_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = products.store_id::uuid
              AND stores.owner_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Vendors can delete their own products" ON public.products
    FOR DELETE USING (
        products.store_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = products.store_id::uuid
              AND stores.owner_id = (SELECT auth.uid())
        )
    );


-- ---- discount_codes ----
DROP POLICY IF EXISTS "Public can read discount codes"          ON public.discount_codes;
DROP POLICY IF EXISTS "Admins can manage discount codes"        ON public.discount_codes;
DROP POLICY IF EXISTS "Vendors can insert their discount codes" ON public.discount_codes;
DROP POLICY IF EXISTS "Vendors can update their discount codes" ON public.discount_codes;
DROP POLICY IF EXISTS "Vendors can delete their discount codes" ON public.discount_codes;

-- SELECT: public
CREATE POLICY "Public can read discount codes" ON public.discount_codes
    FOR SELECT USING (true);

-- Consolidated INSERT: vendor owns the store OR admin
CREATE POLICY "Vendors and admins can insert discount codes" ON public.discount_codes
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.stores WHERE stores.id = discount_codes.store_id AND stores.owner_id = (SELECT auth.uid()))
        OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin')
    );

-- Consolidated UPDATE
CREATE POLICY "Vendors and admins can update discount codes" ON public.discount_codes
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.stores WHERE stores.id = discount_codes.store_id AND stores.owner_id = (SELECT auth.uid()))
        OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin')
    );

-- Consolidated DELETE
CREATE POLICY "Vendors and admins can delete discount codes" ON public.discount_codes
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.stores WHERE stores.id = discount_codes.store_id AND stores.owner_id = (SELECT auth.uid()))
        OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin')
    );


-- ---- orders ----
DROP POLICY IF EXISTS "Users can view their own orders"     ON public.orders;
DROP POLICY IF EXISTS "Vendors can view their store orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders"   ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders"   ON public.orders;
DROP POLICY IF EXISTS "Vendors can update their store orders" ON public.orders;

-- Consolidated SELECT: customer OR vendor
CREATE POLICY "Users and vendors can view orders" ON public.orders
    FOR SELECT USING (
        (SELECT auth.uid()) = orders.user_id
        OR EXISTS (
            SELECT 1 FROM public.order_items
            JOIN public.stores ON order_items.store_id = stores.id
            WHERE order_items.order_id = orders.id
              AND stores.owner_id = (SELECT auth.uid())
        )
    );

-- INSERT: own orders only
CREATE POLICY "Users can insert their own orders" ON public.orders
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = orders.user_id);

-- Consolidated UPDATE: customer OR vendor
CREATE POLICY "Users and vendors can update orders" ON public.orders
    FOR UPDATE USING (
        (SELECT auth.uid()) = orders.user_id
        OR EXISTS (
            SELECT 1 FROM public.order_items
            JOIN public.stores ON order_items.store_id = stores.id
            WHERE order_items.order_id = orders.id
              AND stores.owner_id = (SELECT auth.uid())
        )
    );


-- ---- order_items ----
DROP POLICY IF EXISTS "Users can view their order items"         ON public.order_items;
DROP POLICY IF EXISTS "Vendors can view their store order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert their order items"       ON public.order_items;
DROP POLICY IF EXISTS "Users can update their own order items"   ON public.order_items;
DROP POLICY IF EXISTS "Vendors can update their store order items" ON public.order_items;

-- Consolidated SELECT: customer OR vendor
CREATE POLICY "Users and vendors can view order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
              AND orders.user_id = (SELECT auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = order_items.store_id
              AND stores.owner_id = (SELECT auth.uid())
        )
    );

-- INSERT: via own order
CREATE POLICY "Users can insert their order items" ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
              AND orders.user_id = (SELECT auth.uid())
        )
    );

-- Consolidated UPDATE: customer OR vendor
CREATE POLICY "Users and vendors can update order items" ON public.order_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
              AND orders.user_id = (SELECT auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = order_items.store_id
              AND stores.owner_id = (SELECT auth.uid())
        )
    );


-- ---- reviews ----
DROP POLICY IF EXISTS "Reviews are publicly viewable"          ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews"     ON public.reviews;

CREATE POLICY "Reviews are publicly viewable" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert reviews" ON public.reviews
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = reviews.user_id);

CREATE POLICY "Users can update their own reviews" ON public.reviews
    FOR UPDATE USING ((SELECT auth.uid()) = reviews.user_id)
    WITH CHECK ((SELECT auth.uid()) = reviews.user_id);


-- ---- wishlist ----
DROP POLICY IF EXISTS "Enable all for authenticated users"   ON public.wishlist;
DROP POLICY IF EXISTS "Users can view their own wishlist"    ON public.wishlist;
DROP POLICY IF EXISTS "Users can manage their own wishlist"  ON public.wishlist;

-- Single consolidated policy covering all operations
CREATE POLICY "Users can manage their own wishlist" ON public.wishlist
    FOR ALL USING ((SELECT auth.uid()) = wishlist.user_id)
    WITH CHECK ((SELECT auth.uid()) = wishlist.user_id);


-- ---- addresses ----
DROP POLICY IF EXISTS "Users can view their own addresses"   ON public.addresses;
DROP POLICY IF EXISTS "Users can insert their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can update their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.addresses;

CREATE POLICY "Users can manage their own addresses" ON public.addresses
    FOR ALL USING ((SELECT auth.uid()) = addresses.user_id)
    WITH CHECK ((SELECT auth.uid()) = addresses.user_id);


-- ============================================================
-- PART 5: Add missing indexes for unindexed foreign keys
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_addresses_user_id
    ON public.addresses(user_id);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_by
    ON public.inventory_logs(created_by);

-- order_id and product_id already indexed in 0022, but ensuring:
CREATE INDEX IF NOT EXISTS idx_inventory_logs_order_id
    ON public.inventory_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id
    ON public.inventory_logs(product_id);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
    ON public.order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id
    ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id
    ON public.orders(store_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
    ON public.product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_products_category_id
    ON public.products(category_id);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id
    ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id
    ON public.reviews(product_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id
    ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id
    ON public.wishlist(product_id);


-- ============================================================
-- PART 6: Fix storage bucket listing policies
-- Remove the broad SELECT policy from storage.objects for
-- public buckets (they don't need it for URL access)
-- ============================================================

DROP POLICY IF EXISTS "Public can view product images"          ON storage.objects;
DROP POLICY IF EXISTS "Profile pictures are publicly accessible" ON storage.objects;

-- Recreate scoped to actual file access only (not listing)
-- Public buckets serve files via URL automatically; no SELECT policy needed.
-- Keep upload/delete policies for authenticated vendors/users below.
-- (Upload policies defined elsewhere remain unchanged.)
