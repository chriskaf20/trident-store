-- ============================================================
-- Migration 0032: Definitive fix for remaining advisor warnings
-- Root cause: old policies from previous migrations still exist
-- alongside new ones created in 0031.
-- Fix: Drop ALL policies per table, recreate clean.
-- ============================================================

-- ============================================================
-- ADDRESSES
-- ============================================================
DROP POLICY IF EXISTS "Users can view their own addresses"   ON public.addresses;
DROP POLICY IF EXISTS "Users can insert their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can update their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.addresses;

CREATE POLICY "Users can manage their own addresses" ON public.addresses
    FOR ALL USING ((SELECT auth.uid()) = addresses.user_id)
    WITH CHECK ((SELECT auth.uid()) = addresses.user_id);

-- ============================================================
-- PROFILES
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for all users"     ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone"    ON public.profiles;
DROP POLICY IF EXISTS "Profiles are publicly viewable"       ON public.profiles;
DROP POLICY IF EXISTS "Admins can view any profile"          ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"         ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile"        ON public.profiles;
DROP POLICY IF EXISTS "Users and admins can update profiles" ON public.profiles;

CREATE POLICY "Profiles are publicly viewable" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

-- Note: Admin update handled via service role; user can update own profile only
-- (avoids recursion from querying profiles inside a profiles policy)
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================================
-- VENDOR_APPLICATIONS
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for all users"          ON public.vendor_applications;
DROP POLICY IF EXISTS "Users can view their own applications"     ON public.vendor_applications;
DROP POLICY IF EXISTS "Admins can view all applications"          ON public.vendor_applications;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.vendor_applications;
DROP POLICY IF EXISTS "Users can submit their own application"    ON public.vendor_applications;
DROP POLICY IF EXISTS "Admins can update application status"      ON public.vendor_applications;
DROP POLICY IF EXISTS "Users and admins can view applications"    ON public.vendor_applications;

-- Consolidated SELECT: own application OR admin
CREATE POLICY "Users and admins can view applications" ON public.vendor_applications
    FOR SELECT USING (
        (SELECT auth.uid()) = vendor_applications.user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- Only one INSERT policy
CREATE POLICY "Users can submit their own application" ON public.vendor_applications
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = vendor_applications.user_id);

CREATE POLICY "Admins can update application status" ON public.vendor_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- ============================================================
-- STORES
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for all users" ON public.stores;
DROP POLICY IF EXISTS "Stores are publicly viewable"     ON public.stores;
DROP POLICY IF EXISTS "Vendors can manage their store"   ON public.stores;
DROP POLICY IF EXISTS "Admins can manage all stores"     ON public.stores;
DROP POLICY IF EXISTS "Vendors and admins can manage stores" ON public.stores;

-- 1 SELECT policy only
CREATE POLICY "Stores are publicly viewable" ON public.stores
    FOR SELECT USING (true);

-- Separate INSERT/UPDATE/DELETE for vendors+admins (no SELECT overlap)
CREATE POLICY "Vendors and admins can insert stores" ON public.stores
    FOR INSERT WITH CHECK (
        (SELECT auth.uid()) = stores.owner_id
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

CREATE POLICY "Vendors and admins can update stores" ON public.stores
    FOR UPDATE USING (
        (SELECT auth.uid()) = stores.owner_id
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    )
    WITH CHECK (
        (SELECT auth.uid()) = stores.owner_id
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

CREATE POLICY "Vendors and admins can delete stores" ON public.stores
    FOR DELETE USING (
        (SELECT auth.uid()) = stores.owner_id
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

-- ============================================================
-- PRODUCTS
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for all users"      ON public.products;
DROP POLICY IF EXISTS "Products are viewable by everyone"     ON public.products;
DROP POLICY IF EXISTS "Vendors can insert their own products" ON public.products;
DROP POLICY IF EXISTS "Vendors can update their own products" ON public.products;
DROP POLICY IF EXISTS "Vendors can delete their own products" ON public.products;

CREATE POLICY "Products are viewable by everyone" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Vendors can insert their own products" ON public.products
    FOR INSERT WITH CHECK (
        store_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.stores
            WHERE id = store_id::uuid AND owner_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Vendors can update their own products" ON public.products
    FOR UPDATE USING (
        store_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.stores
            WHERE id = store_id::uuid AND owner_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Vendors can delete their own products" ON public.products
    FOR DELETE USING (
        store_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.stores
            WHERE id = store_id::uuid AND owner_id = (SELECT auth.uid())
        )
    );

-- ============================================================
-- CATEGORIES — split FOR ALL into per-action to avoid SELECT overlap
-- ============================================================
DROP POLICY IF EXISTS "Categories are publicly viewable" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories"     ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories"     ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories"     ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories"     ON public.categories;

-- Only 1 SELECT policy (no duplicate with admin FOR ALL)
CREATE POLICY "Categories are publicly viewable" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert categories" ON public.categories
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

CREATE POLICY "Admins can update categories" ON public.categories
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

CREATE POLICY "Admins can delete categories" ON public.categories
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

-- ============================================================
-- DISCOUNT_CODES
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for all users"             ON public.discount_codes;
DROP POLICY IF EXISTS "Enable update for all users"                  ON public.discount_codes;
DROP POLICY IF EXISTS "Public can read discount codes"               ON public.discount_codes;
DROP POLICY IF EXISTS "Admins can manage discount codes"             ON public.discount_codes;
DROP POLICY IF EXISTS "Vendors can manage their discount codes"      ON public.discount_codes;
DROP POLICY IF EXISTS "Vendors can insert their discount codes"      ON public.discount_codes;
DROP POLICY IF EXISTS "Vendors can update their discount codes"      ON public.discount_codes;
DROP POLICY IF EXISTS "Vendors can delete their discount codes"      ON public.discount_codes;
DROP POLICY IF EXISTS "Vendors and admins can insert discount codes" ON public.discount_codes;
DROP POLICY IF EXISTS "Vendors and admins can update discount codes" ON public.discount_codes;
DROP POLICY IF EXISTS "Vendors and admins can delete discount codes" ON public.discount_codes;

CREATE POLICY "Public can read discount codes" ON public.discount_codes
    FOR SELECT USING (true);

CREATE POLICY "Vendors and admins can insert discount codes" ON public.discount_codes
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = (SELECT auth.uid()))
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

CREATE POLICY "Vendors and admins can update discount codes" ON public.discount_codes
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = (SELECT auth.uid()))
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

CREATE POLICY "Vendors and admins can delete discount codes" ON public.discount_codes
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = (SELECT auth.uid()))
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

-- ============================================================
-- ORDERS
-- ============================================================
DROP POLICY IF EXISTS "Enable insert for all users"          ON public.orders;
DROP POLICY IF EXISTS "Enable read access for all users"     ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders"      ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders"    ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders"    ON public.orders;
DROP POLICY IF EXISTS "Vendors can view their store orders"  ON public.orders;
DROP POLICY IF EXISTS "Vendors can update their store orders" ON public.orders;
DROP POLICY IF EXISTS "Users and vendors can view orders"    ON public.orders;
DROP POLICY IF EXISTS "Users and vendors can update orders"  ON public.orders;

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

-- ============================================================
-- ORDER_ITEMS
-- ============================================================
DROP POLICY IF EXISTS "Enable insert for all users"               ON public.order_items;
DROP POLICY IF EXISTS "Enable read access for all users"          ON public.order_items;
DROP POLICY IF EXISTS "Users can view their order items"          ON public.order_items;
DROP POLICY IF EXISTS "Vendors can view their store order items"  ON public.order_items;
DROP POLICY IF EXISTS "Users can insert their order items"        ON public.order_items;
DROP POLICY IF EXISTS "Users can update their own order items"    ON public.order_items;
DROP POLICY IF EXISTS "Vendors can update their store order items" ON public.order_items;
DROP POLICY IF EXISTS "Users and vendors can view order items"    ON public.order_items;
DROP POLICY IF EXISTS "Users and vendors can update order items"  ON public.order_items;

CREATE POLICY "Users and vendors can view order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE id = order_items.order_id AND user_id = (SELECT auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.stores
            WHERE id = order_items.store_id AND owner_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Users can insert their order items" ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE id = order_items.order_id AND user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Users and vendors can update order items" ON public.order_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE id = order_items.order_id AND user_id = (SELECT auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.stores
            WHERE id = order_items.store_id AND owner_id = (SELECT auth.uid())
        )
    );

-- ============================================================
-- REVIEWS
-- ============================================================
DROP POLICY IF EXISTS "Enable insert for all users"            ON public.reviews;
DROP POLICY IF EXISTS "Enable read access for all users"       ON public.reviews;
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

-- ============================================================
-- WISHLIST
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for all users"    ON public.wishlist;
DROP POLICY IF EXISTS "Enable all for authenticated users"  ON public.wishlist;
DROP POLICY IF EXISTS "Users can view their own wishlist"   ON public.wishlist;
DROP POLICY IF EXISTS "Users can manage their own wishlist" ON public.wishlist;

-- Single policy for all operations
CREATE POLICY "Users can manage their own wishlist" ON public.wishlist
    FOR ALL USING ((SELECT auth.uid()) = wishlist.user_id)
    WITH CHECK ((SELECT auth.uid()) = wishlist.user_id);

-- ============================================================
-- PRODUCT_VARIANTS — split FOR ALL to avoid SELECT overlap
-- ============================================================
DROP POLICY IF EXISTS "Product variants are publicly viewable"      ON public.product_variants;
DROP POLICY IF EXISTS "Vendors can manage their product variants"   ON public.product_variants;
DROP POLICY IF EXISTS "Vendors can insert their product variants"   ON public.product_variants;
DROP POLICY IF EXISTS "Vendors can update their product variants"   ON public.product_variants;
DROP POLICY IF EXISTS "Vendors can delete their product variants"   ON public.product_variants;

-- Only 1 SELECT policy
CREATE POLICY "Product variants are publicly viewable" ON public.product_variants
    FOR SELECT USING (true);

CREATE POLICY "Vendors can insert their product variants" ON public.product_variants
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.products
            JOIN public.stores ON stores.id = products.store_id::uuid
            WHERE products.id = product_variants.product_id
              AND stores.owner_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Vendors can update their product variants" ON public.product_variants
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.products
            JOIN public.stores ON stores.id = products.store_id::uuid
            WHERE products.id = product_variants.product_id
              AND stores.owner_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Vendors can delete their product variants" ON public.product_variants
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.products
            JOIN public.stores ON stores.id = products.store_id::uuid
            WHERE products.id = product_variants.product_id
              AND stores.owner_id = (SELECT auth.uid())
        )
    );
