-- ============================================================
-- 0007_security_fixes.sql
-- Fixes Supabase security advisor warnings:
--   1. function_search_path_mutable (6 functions)
--   2. rls_policy_always_true (overly permissive policies)
--
-- Written against the actual schema:
--   - discount_codes: no store_id column
--   - products.store_id: text (stores.id is uuid → cast needed)
--   - orders.store_id:   text (stores.id is uuid → cast needed)
-- ============================================================


-- ============================================================
-- PART 1: Fix mutable search_path on all public functions
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'customer');
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_default_address()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.addresses
    SET is_default = false
    WHERE user_id = NEW.user_id AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  UPDATE public.products
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_store_product_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.stores SET product_count = product_count + 1 WHERE id = NEW.store_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.stores SET product_count = product_count - 1 WHERE id = OLD.store_id;
  END IF;
  RETURN NULL;
END;
$$;


-- ============================================================
-- PART 2: Fix overly permissive RLS policies
-- ============================================================


-- ---- discount_codes ----
-- NOTE: discount_codes has NO store_id column.
-- Public read is fine. Write operations restricted to admins only.
DROP POLICY IF EXISTS "Enable read access for all users"        ON public.discount_codes;
DROP POLICY IF EXISTS "Enable update for all users"             ON public.discount_codes;
DROP POLICY IF EXISTS "Public can read discount codes"          ON public.discount_codes;
DROP POLICY IF EXISTS "Vendors can manage their discount codes" ON public.discount_codes;
DROP POLICY IF EXISTS "Admins can manage discount codes"        ON public.discount_codes;

CREATE POLICY "Public can read discount codes" ON public.discount_codes
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage discount codes" ON public.discount_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );


-- ---- newsletter_subscribers ----
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;

CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (email IS NOT NULL AND email <> '');


-- ---- order_items ----
-- order_items has: order_id, product_id (text), product_name, product_image, quantity, price
-- Vendor access goes through orders.store_id (text) → cast to uuid to join stores
DROP POLICY IF EXISTS "Enable insert for all users"              ON public.order_items;
DROP POLICY IF EXISTS "Enable read access for all users"         ON public.order_items;
DROP POLICY IF EXISTS "Users can view their order items"         ON public.order_items;
DROP POLICY IF EXISTS "Vendors can view their store order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert their order items"       ON public.order_items;

CREATE POLICY "Users can view their order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can view their store order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      JOIN public.stores ON stores.id = orders.store_id::uuid
      WHERE orders.id = order_items.order_id
        AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );


-- ---- orders ----
-- orders.store_id is text; stores.id is uuid → cast with ::uuid
DROP POLICY IF EXISTS "Enable insert for all users"          ON public.orders;
DROP POLICY IF EXISTS "Enable read access for all users"     ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders"      ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders"    ON public.orders;
DROP POLICY IF EXISTS "Vendors can view their store orders"  ON public.orders;
DROP POLICY IF EXISTS "Vendors can update their store orders" ON public.orders;

CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = orders.user_id);

CREATE POLICY "Users can insert their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = orders.user_id);

CREATE POLICY "Vendors can view their store orders" ON public.orders
  FOR SELECT USING (
    orders.store_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = orders.store_id::uuid
        AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update their store orders" ON public.orders
  FOR UPDATE USING (
    orders.store_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = orders.store_id::uuid
        AND stores.owner_id = auth.uid()
    )
  );


-- ---- products ----
-- products.store_id is text; stores.id is uuid → cast with ::uuid
DROP POLICY IF EXISTS "Enable read access for all users"      ON public.products;
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
        AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update their own products" ON public.products
  FOR UPDATE USING (
    products.store_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = products.store_id::uuid
        AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can delete their own products" ON public.products
  FOR DELETE USING (
    products.store_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = products.store_id::uuid
        AND stores.owner_id = auth.uid()
    )
  );


-- ---- profiles ----
DROP POLICY IF EXISTS "Enable read access for all users"   ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone"  ON public.profiles;
DROP POLICY IF EXISTS "Profiles are publicly viewable"     ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"       ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Profiles are publicly viewable" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = profiles.id)
  WITH CHECK (auth.uid() = profiles.id);


-- ---- reviews ----
DROP POLICY IF EXISTS "Enable insert for all users"            ON public.reviews;
DROP POLICY IF EXISTS "Enable read access for all users"       ON public.reviews;
DROP POLICY IF EXISTS "Reviews are publicly viewable"          ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews"     ON public.reviews;

CREATE POLICY "Reviews are publicly viewable" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = reviews.user_id);

CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = reviews.user_id)
  WITH CHECK (auth.uid() = reviews.user_id);


-- ---- stores ----
DROP POLICY IF EXISTS "Enable read access for all users" ON public.stores;
DROP POLICY IF EXISTS "Stores are publicly viewable"     ON public.stores;
DROP POLICY IF EXISTS "Vendors can manage their store"   ON public.stores;

CREATE POLICY "Stores are publicly viewable" ON public.stores
  FOR SELECT USING (true);

CREATE POLICY "Vendors can manage their store" ON public.stores
  FOR ALL USING (auth.uid() = stores.owner_id)
  WITH CHECK (auth.uid() = stores.owner_id);


-- ---- vendor_applications ----
DROP POLICY IF EXISTS "Enable read access for all users"       ON public.vendor_applications;
DROP POLICY IF EXISTS "Users can view their own applications"  ON public.vendor_applications;
DROP POLICY IF EXISTS "Admins can view all applications"       ON public.vendor_applications;
DROP POLICY IF EXISTS "Users can submit their own application" ON public.vendor_applications;
DROP POLICY IF EXISTS "Admins can update application status"   ON public.vendor_applications;

CREATE POLICY "Users can view their own applications" ON public.vendor_applications
  FOR SELECT USING (auth.uid() = vendor_applications.user_id);

CREATE POLICY "Admins can view all applications" ON public.vendor_applications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Users can submit their own application" ON public.vendor_applications
  FOR INSERT WITH CHECK (auth.uid() = vendor_applications.user_id);

CREATE POLICY "Admins can update application status" ON public.vendor_applications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );


-- ---- wishlist ----
DROP POLICY IF EXISTS "Enable read access for all users"    ON public.wishlist;
DROP POLICY IF EXISTS "Users can view their own wishlist"   ON public.wishlist;
DROP POLICY IF EXISTS "Users can manage their own wishlist" ON public.wishlist;

CREATE POLICY "Users can view their own wishlist" ON public.wishlist
  FOR SELECT USING (auth.uid() = wishlist.user_id);

CREATE POLICY "Users can manage their own wishlist" ON public.wishlist
  FOR ALL USING (auth.uid() = wishlist.user_id)
  WITH CHECK (auth.uid() = wishlist.user_id);
