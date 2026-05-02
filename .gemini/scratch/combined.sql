

-- FILE: 0000_init.sql

-- 1. Create a trigger to automatically insert a profile when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'customer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Setup Row Level Security (RLS) for public.products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone can view products
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Products are viewable by everyone" ON public.products
  FOR SELECT USING (true);

-- Only authenticated vendors can insert products for their store
DROP POLICY IF EXISTS "Vendors can insert their own products" ON public.products;
CREATE POLICY "Vendors can insert their own products" ON public.products
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT owner_id FROM public.stores WHERE stores.id = products.store_id
    )
  );

-- Only authenticated vendors can update their own products
DROP POLICY IF EXISTS "Vendors can update their own products" ON public.products;
CREATE POLICY "Vendors can update their own products" ON public.products
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT owner_id FROM public.stores WHERE stores.id = products.store_id
    )
  );

-- Only authenticated vendors can delete their own products
DROP POLICY IF EXISTS "Vendors can delete their own products" ON public.products;
CREATE POLICY "Vendors can delete their own products" ON public.products
  FOR DELETE USING (
    auth.uid() IN (
      SELECT owner_id FROM public.stores WHERE stores.id = products.store_id
    )
  );

-- 3. Setup Row Level Security (RLS) for public.orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Customers can view their own orders
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- Customers can insert their own orders
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Users can insert their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Vendors can view orders for their store
DROP POLICY IF EXISTS "Vendors can view their store orders" ON public.orders;
CREATE POLICY "Vendors can view their store orders" ON public.orders
  FOR SELECT USING (
    auth.uid() IN (
      SELECT owner_id FROM public.stores WHERE stores.id = orders.store_id
    )
  );

-- Vendors can update orders for their store (e.g., status changes)
DROP POLICY IF EXISTS "Vendors can update their store orders" ON public.orders;
CREATE POLICY "Vendors can update their store orders" ON public.orders
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT owner_id FROM public.stores WHERE stores.id = orders.store_id
    )
  );


-- FILE: 0001_addresses.sql

-- Create addresses table for users
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT,
    zip_code TEXT,
    country TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on RLS
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Users can view their own addresses
DROP POLICY IF EXISTS "Users can view their own addresses" ON public.addresses;
CREATE POLICY "Users can view their own addresses" ON public.addresses
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own addresses
DROP POLICY IF EXISTS "Users can insert their own addresses" ON public.addresses;
CREATE POLICY "Users can insert their own addresses" ON public.addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own addresses
DROP POLICY IF EXISTS "Users can update their own addresses" ON public.addresses;
CREATE POLICY "Users can update their own addresses" ON public.addresses
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own addresses
DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.addresses;
CREATE POLICY "Users can delete their own addresses" ON public.addresses
    FOR DELETE USING (auth.uid() = user_id);

-- Function to handle setting only one default address
CREATE OR REPLACE FUNCTION public.handle_default_address()
RETURNS trigger AS $$
BEGIN
    IF NEW.is_default = true THEN
        -- Set all other addresses for this user to false
        UPDATE public.addresses
        SET is_default = false
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to enforce only one default address
DROP TRIGGER IF EXISTS ensure_single_default_address ON public.addresses;
CREATE TRIGGER ensure_single_default_address
    BEFORE INSERT OR UPDATE ON public.addresses
    FOR EACH ROW
    WHEN (NEW.is_default = true)
    EXECUTE PROCEDURE public.handle_default_address();


-- FILE: 0002_profile_extensions.sql

-- Add new fields to the profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS avatar_emoji TEXT DEFAULT '👤';

-- Ensure RLS is enabled for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow users to view all profiles (or just their own, depending on public needs)
-- Assuming customers only need to view their own, and vendors need to be viewable
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);


-- FILE: 0003_simplify_addresses.sql

-- Update addresses table to simplify the address fields according to user request

-- Drop the columns we no longer need (city, state, zip_code, country)
ALTER TABLE public.addresses
DROP COLUMN IF EXISTS city,
DROP COLUMN IF EXISTS state,
DROP COLUMN IF EXISTS zip_code,
DROP COLUMN IF EXISTS country;

-- Add the new requested columns
ALTER TABLE public.addresses
ADD COLUMN IF NOT EXISTS apartment_door TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS map_location_link TEXT;


-- FILE: 0004_trending_and_original_price.sql

-- Migration: Add is_trending and original_price to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2) DEFAULT NULL;

-- Update some existing products to be trending (if any exist)
-- Admin can set these via the dashboard


-- FILE: 0005_seed_products.sql

-- ============================================================
-- SEED: Create store + products for testing
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- STEP 1: Create a store linked to YOUR admin user
-- (This uses your logged-in admin account as the store owner)
DO $$
DECLARE
  admin_id UUID;
  new_store_id UUID;
BEGIN
  -- Get the first admin user
  SELECT id INTO admin_id FROM public.profiles WHERE role = 'admin' LIMIT 1;

  IF admin_id IS NULL THEN
    -- Fallback: use first user in auth
    SELECT id INTO admin_id FROM auth.users LIMIT 1;
  END IF;

  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'No user found. Please sign up/in first.';
  END IF;

  -- Check if a store already exists for this user
  SELECT id INTO new_store_id FROM public.stores WHERE owner_id = admin_id LIMIT 1;

  IF new_store_id IS NULL THEN
    INSERT INTO public.stores (owner_id, name, slug, description, is_active)
    VALUES (admin_id, 'Trident Official', 'trident-official', 'The official Trident flagship store.', true)
    RETURNING id INTO new_store_id;
    RAISE NOTICE 'Created store with id: %', new_store_id;
  ELSE
    RAISE NOTICE 'Store already exists with id: %', new_store_id;
  END IF;

  -- STEP 2: Insert products (only if not already seeded)
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE store_id = new_store_id::text LIMIT 1) THEN

    -- Women's Collection
    INSERT INTO public.products (store_id, name, description, price, original_price, category, stock_quantity, images, is_trending) VALUES
    (new_store_id::text, 'Silk Wrap Midi Dress', 'Elegant wrap-style midi dress in ivory silk blend.', 89.99, 129.00, 'Women', 25, ARRAY['https://images.unsplash.com/photo-1612336307429-8a898d10e223?q=80&w=600'], true),
    (new_store_id::text, 'Oversized Blazer Co-Ord', 'Matching blazer and trouser set in camel.', 119.00, 165.00, 'Women', 18, ARRAY['https://images.unsplash.com/photo-1594938298603-c8148c4b4463?q=80&w=600'], false),
    (new_store_id::text, 'Floral Chiffon Blouse', 'Lightweight chiffon blouse with cascading floral print.', 45.00, 65.00, 'Women', 30, ARRAY['https://images.unsplash.com/photo-1551163943-3f7253a97845?q=80&w=600'], true),
    (new_store_id::text, 'High-Waist Wide Leg Jeans', 'Premium denim in classic indigo.', 79.00, null, 'Women', 22, ARRAY['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600'], false),
    (new_store_id::text, 'Knit Ribbed Midi Skirt', 'Ribbed stretch knit midi skirt in chocolate brown.', 55.00, 75.00, 'Women', 15, ARRAY['https://images.unsplash.com/photo-1582533561751-ef6f59c8b2e1?q=80&w=600'], false),
    (new_store_id::text, 'Linen Shirt Dress', 'Relaxed linen shirt dress in crisp white.', 68.00, null, 'Women', 20, ARRAY['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=600'], true);

    -- Men's Collection
    INSERT INTO public.products (store_id, name, description, price, original_price, category, stock_quantity, images, is_trending) VALUES
    (new_store_id::text, 'Slim-Fit Oxford Shirt', 'Classic oxford cotton shirt in pale blue.', 55.00, 80.00, 'Men', 30, ARRAY['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=600'], true),
    (new_store_id::text, 'Slim-Cut Chino Trousers', 'Stretch cotton chino in slate grey.', 69.00, 95.00, 'Men', 20, ARRAY['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=600'], false),
    (new_store_id::text, 'Technical Harrington Jacket', 'Lightweight technical water-resistant jacket.', 125.00, 175.00, 'Men', 12, ARRAY['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600'], true),
    (new_store_id::text, 'Heavy Wash Denim Jacket', 'Acid-washed denim jacket with distressed details.', 89.00, null, 'Men', 18, ARRAY['https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?q=80&w=600'], false),
    (new_store_id::text, 'Premium Pique Polo', 'Classic polo in premium cotton pique.', 45.00, 65.00, 'Men', 35, ARRAY['https://images.unsplash.com/photo-1571945153237-4929e783af4a?q=80&w=600'], false),
    (new_store_id::text, 'Oversized Graphic Tee', 'Dropped-shoulder tee with bold abstract graphic.', 35.00, 50.00, 'Men', 40, ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600'], true);

    -- Accessories
    INSERT INTO public.products (store_id, name, description, price, original_price, category, stock_quantity, images, is_trending) VALUES
    (new_store_id::text, 'Midnight Chronograph Watch', 'Stainless steel chronograph, sapphire crystal.', 350.00, 450.00, 'Accessories', 8, ARRAY['https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=600'], true),
    (new_store_id::text, 'Mini Leather Crossbody Bag', 'Genuine leather crossbody in tan.', 95.00, 130.00, 'Accessories', 14, ARRAY['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=600'], true),
    (new_store_id::text, 'Aviator Sunglasses', 'Classic gold-frame aviators, UV400 protection.', 65.00, 90.00, 'Accessories', 25, ARRAY['https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=600'], false),
    (new_store_id::text, 'Cashmere Blend Scarf', '100% cashmere-blend scarf in camel check.', 55.00, null, 'Accessories', 20, ARRAY['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?q=80&w=600'], false),
    (new_store_id::text, 'Leather Card Wallet', 'Slim bifold wallet in full-grain Italian leather.', 45.00, 60.00, 'Accessories', 30, ARRAY['https://images.unsplash.com/photo-1627123424574-724758594785?q=80&w=600'], false),
    (new_store_id::text, 'Tortoiseshell Bucket Hat', 'Premium woven bucket hat.', 35.00, null, 'Accessories', 22, ARRAY['https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?q=80&w=600'], true);

    RAISE NOTICE 'Products seeded successfully for store: %', new_store_id;
  ELSE
    RAISE NOTICE 'Products already exist for store: %. Skipping seed.', new_store_id;
  END IF;

END $$;


-- FILE: 0006_orders_map_link.sql

-- Migration: Add map_link to orders, drop city and postal_code if they exist
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS map_link TEXT DEFAULT NULL;

-- Drop old fields if they exist (safe with IF EXISTS)
ALTER TABLE orders
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS postal_code,
  DROP COLUMN IF EXISTS country;


-- FILE: 0007_security_fixes.sql

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


-- FILE: 0008_orders_cleanup.sql

-- Migration: Remove required email/phone from orders, fix RLS insert policy

-- 1. Make email and phone nullable (they're no longer collected at checkout)
ALTER TABLE public.orders
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL;

-- 2. Set existing NULLs to empty string if column exists as NOT NULL was previously enforced
--    (This is a no-op if columns are already nullable)

-- 3. Fix the orders INSERT RLS policy so authenticated users can place orders.
--    The previous policy only allowed insert if user_id = auth.uid(),
--    but we still want to make sure orders are linked to real users.
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;

CREATE POLICY "Users can insert their own orders" ON public.orders
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = orders.user_id
  );


-- FILE: 0009_vendor_applications_setup.sql

-- ============================================================
-- 0009_vendor_applications_setup.sql
-- Ensures the vendor_applications table exists with proper
-- columns, RLS enabled, and all required policies.
-- Safe to run even if the table already exists (uses IF NOT EXISTS).
-- ============================================================

-- 1. Create the vendor_applications table if it doesn't already exist
CREATE TABLE IF NOT EXISTS public.vendor_applications (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    store_name  text NOT NULL,
    store_slug  text NOT NULL,
    description text,
    city        text,
    instagram   text,
    whatsapp    text,
    status      text NOT NULL DEFAULT 'pending',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS (idempotent)
ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;

-- 3. Drop old / conflicting policies
DROP POLICY IF EXISTS "Enable read access for all users"       ON public.vendor_applications;
DROP POLICY IF EXISTS "Users can view their own applications"  ON public.vendor_applications;
DROP POLICY IF EXISTS "Admins can view all applications"       ON public.vendor_applications;
DROP POLICY IF EXISTS "Users can submit their own application" ON public.vendor_applications;
DROP POLICY IF EXISTS "Admins can update application status"   ON public.vendor_applications;

-- 4. Create policies

-- Users can see their own application
CREATE POLICY "Users can view their own applications" ON public.vendor_applications
    FOR SELECT USING (auth.uid() = vendor_applications.user_id);

-- Admins can see ALL applications (this is the key policy for the admin dashboard)
CREATE POLICY "Admins can view all applications" ON public.vendor_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Users can insert their own application
CREATE POLICY "Users can submit their own application" ON public.vendor_applications
    FOR INSERT WITH CHECK (auth.uid() = vendor_applications.user_id);

-- Admins can update (approve / reject) any application
CREATE POLICY "Admins can update application status" ON public.vendor_applications
    FOR UPDATE USING (
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

-- 5. Auto-update updated_at on every row change
DROP TRIGGER IF EXISTS set_vendor_applications_updated_at ON public.vendor_applications;
CREATE TRIGGER set_vendor_applications_updated_at
    BEFORE UPDATE ON public.vendor_applications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- FILE: 0010_vendor_applications_add_applicant_info.sql

-- ============================================================
-- 0010_vendor_applications_add_applicant_info.sql
-- Adds applicant_name and applicant_email columns to
-- vendor_applications so the admin dashboard can display
-- applicant info without a FK join on profiles (which fails
-- silently when RLS blocks cross-user profile reads).
-- ============================================================

-- Add columns (safe to run multiple times - IF NOT EXISTS is not
-- supported for ADD COLUMN before PG 9.6, but we use DO block)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'vendor_applications'
          AND column_name = 'applicant_name'
    ) THEN
        ALTER TABLE public.vendor_applications
            ADD COLUMN applicant_name text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'vendor_applications'
          AND column_name = 'applicant_email'
    ) THEN
        ALTER TABLE public.vendor_applications
            ADD COLUMN applicant_email text;
    END IF;

    -- It appears the user's table might be missing updated_at as well,
    -- which causes the update_updated_at_column trigger to fail during backfill.
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'vendor_applications'
          AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.vendor_applications
            ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
    END IF;

    -- Add missing columns to stores table required by the approval action
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'stores'
          AND column_name = 'instagram'
    ) THEN
        ALTER TABLE public.stores
            ADD COLUMN instagram text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'stores'
          AND column_name = 'whatsapp'
    ) THEN
        ALTER TABLE public.stores
            ADD COLUMN whatsapp text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'stores'
          AND column_name = 'city'
    ) THEN
        ALTER TABLE public.stores
            ADD COLUMN city text;
    END IF;
END $$;

-- Backfill existing rows with profile data (if any)
UPDATE public.vendor_applications va
SET
    applicant_name  = split_part(p.email, '@', 1), -- Fallback since profiles doesn't store name
    applicant_email = p.email
FROM public.profiles p
WHERE va.user_id = p.id
  AND (va.applicant_name IS NULL OR va.applicant_email IS NULL);

-- Add RLS policy so Admins can create and manage stores (they create the store for the vendor on approval)
DROP POLICY IF EXISTS "Admins can manage all stores" ON public.stores;
CREATE POLICY "Admins can manage all stores" ON public.stores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );


-- FILE: 0011_admin_profile_update.sql

-- ============================================================
-- 0011_admin_profile_update.sql
-- Fixes issue where Admins cannot approve a vendor because
-- the RLS policy on `profiles` only allows users to update
-- their own profile. Adding a policy for Admins to update any profile.
-- ============================================================

-- Add policy to allow admins to update profiles (e.g. changing role from 'customer' to 'vendor')
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Also ensure admins have a fallback policy for selecting profiles,
-- just in case the "Profiles are publicly viewable" policy gets removed.
DROP POLICY IF EXISTS "Admins can view any profile" ON public.profiles;

CREATE POLICY "Admins can view any profile" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- FILE: 0012_fix_profiles_recursion.sql

-- ============================================================
-- 0012_fix_profiles_recursion.sql
-- Fixes infinite recursion issue in the `profiles` table.
-- The previous migration `0011_admin_profile_update.sql`
-- introduced policies that queried the `profiles` table,
-- causing an infinite loop. This uses `public.is_admin()` instead.
-- ============================================================

-- Fix infinite recursion caused by previous profile policies
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view any profile" ON public.profiles;

-- Use the existing SECURITY DEFINER function to prevent infinite recursion
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (
    public.is_admin()
  )
  WITH CHECK (
    public.is_admin()
  );

CREATE POLICY "Admins can view any profile" ON public.profiles
  FOR SELECT USING (
    public.is_admin()
  );


-- FILE: 0013_approve_vendor_role.sql

-- ============================================================
-- 0013_approve_vendor_role.sql
-- Creates a secure RPC function for admins to update a user's role.
-- Bypasses the recursive RLS issues on the `profiles` table.
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_update_user_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Verify caller is an admin
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    -- Update the role
    UPDATE public.profiles
    SET role = new_role
    WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized: Caller is not an admin.';
  END IF;
END;
$$;


-- FILE: 0014_unique_store_owner.sql

-- ============================================================
-- 0014_unique_store_owner.sql
-- 1. Deduplicate stores: Keep only the oldest store for each owner.
-- 2. Adds a UNIQUE constraint to the owner_id column.
-- ============================================================

-- 1. Delete redundant stores, keeping the oldest one for each user
DELETE FROM public.stores
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY created_at ASC) as row_num
        FROM public.stores
    ) t
    WHERE t.row_num > 1
);

-- 2. Add the unique constraint
ALTER TABLE public.stores
ADD CONSTRAINT stores_owner_id_key UNIQUE (owner_id);


-- FILE: 0015_performance_indexes.sql

-- Performance Indexes Migration
-- Adds missing indexes for all high-frequency query patterns across the marketplace

-- ─── Products ───────────────────────────────────────────────────────────────
-- Vendor product listing: SELECT * FROM products WHERE store_id = $1
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);

-- Category browsing / filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- Trending page: SELECT * FROM products WHERE is_trending = true
CREATE INDEX IF NOT EXISTS idx_products_is_trending ON public.products(is_trending) WHERE is_trending = true;

-- ─── Orders ─────────────────────────────────────────────────────────────────
-- Customer order history: SELECT * FROM orders WHERE user_id = $1
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- Vendor order management: SELECT * FROM orders WHERE store_id = $1
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);

-- Admin / vendor order filtering by status
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- ─── Order Items ─────────────────────────────────────────────────────────────
-- Fetching items for an order
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- ─── Reviews ─────────────────────────────────────────────────────────────────
-- Product review listing: SELECT * FROM reviews WHERE product_id = $1
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);

-- ─── Wishlist ────────────────────────────────────────────────────────────────
-- User wishlist: SELECT * FROM wishlist WHERE user_id = $1
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);

-- ─── Vendor Applications ─────────────────────────────────────────────────────
-- Admin pending applications: SELECT * FROM vendor_applications WHERE status = 'pending'
CREATE INDEX IF NOT EXISTS idx_vendor_applications_status ON public.vendor_applications(status);

-- Admin: applications by user
CREATE INDEX IF NOT EXISTS idx_vendor_applications_user_id ON public.vendor_applications(user_id);

-- ─── Addresses ───────────────────────────────────────────────────────────────
-- User address lookup: SELECT * FROM addresses WHERE user_id = $1
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);


-- FILE: 0016_product_images_array.sql

-- Add images array column to products for multi-image gallery support.
-- The existing `image` column is kept as the primary/fallback image.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';


-- FILE: 0017_reviews_fit_rating.sql

-- Add fit_rating column to reviews for fit feedback feature.
-- Allowed values: 'runs_small', 'true_to_size', 'runs_large', or NULL.
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS fit_rating text
  CHECK (fit_rating IN ('runs_small', 'true_to_size', 'runs_large'));


-- FILE: 0018_product_variants.sql

-- Migration: Add product variant fields (Simplified)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sizes        text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS colors       jsonb   DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS tags         text[]  DEFAULT '{}';


-- FILE: 0019_cleanup_product_fields.sql

-- Migration: Remove unwanted product columns (SEO, Details, Subcategory)
-- Based on the user's request to simplify the backend.

-- First, drop the unique index on slug if it exists
DROP INDEX IF EXISTS public.products_slug_idx;

-- Drop the columns
ALTER TABLE public.products
  DROP COLUMN IF EXISTS material,
  DROP COLUMN IF EXISTS care_instructions,
  DROP COLUMN IF EXISTS short_description,
  DROP COLUMN IF EXISTS slug,
  DROP COLUMN IF EXISTS meta_title,
  DROP COLUMN IF EXISTS meta_description;

-- Note: Subcategory wasn't in the provided schema, so no drop needed if it doesn't exist.
-- If it did exist previously, the DROP COLUMN IF EXISTS handles it.
ALTER TABLE public.products DROP COLUMN IF EXISTS subcategory;


-- FILE: 0020_restore_product_slug.sql

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text; UPDATE public.products SET slug = trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')) || '-' || substr(id::text, 1, 8) WHERE slug IS NULL; ALTER TABLE public.products ALTER COLUMN slug SET NOT NULL; CREATE UNIQUE INDEX IF NOT EXISTS products_slug_idx ON public.products(slug);

-- FILE: 0021_products_with_stores_view.sql

-- Create a view that joins products with their store information
-- This eliminates N+1 queries when fetching products with store names

CREATE OR REPLACE VIEW public.products_with_stores AS
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
FROM
    public.products p
LEFT JOIN
    public.stores s ON p.store_id::uuid = s.id;

-- Create an index on the store_id for better query performance
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);


-- FILE: 0022_inventory_management.sql

-- ============================================================
-- Migration 0022: Inventory Management System
-- Adds stock reservation, decrement logic, and audit trails
-- ============================================================

-- 1. Add inventory constraints to products table
ALTER TABLE public.products
    ADD CONSTRAINT check_stock_not_negative CHECK (stock_quantity >= 0),
    ADD COLUMN IF NOT EXISTS reserved_quantity INT DEFAULT 0 CHECK (reserved_quantity >= 0);

-- 2. Create inventory_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('reserve', 'decrement', 'refund', 'adjustment', 'cancel_reservation')),
    quantity INT NOT NULL,
    quantity_before INT NOT NULL,
    quantity_after INT NOT NULL,
    reserved_before INT DEFAULT 0,
    reserved_after INT DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on inventory_logs
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- Everyone can view logs (read-only)
CREATE POLICY "Inventory logs are viewable by authenticated users" ON public.inventory_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON public.inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_order_id ON public.inventory_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON public.inventory_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_action ON public.inventory_logs(action);

-- 3. Create RPC function to safely reserve stock (transaction-safe)
CREATE OR REPLACE FUNCTION public.reserve_product_stock(
    p_product_id UUID,
    p_quantity INT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current_stock INT;
    v_current_reserved INT;
    v_available INT;
    v_result JSONB;
BEGIN
    -- Lock the row for update (prevents concurrent issues)
    SELECT stock_quantity, reserved_quantity
    INTO v_current_stock, v_current_reserved
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Product not found',
            'code', 'PRODUCT_NOT_FOUND'
        );
    END IF;

    -- Calculate available stock (not reserved)
    v_available := v_current_stock - v_current_reserved;

    -- Check if enough stock available
    IF v_available < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Insufficient stock. Available: %s, Requested: %s', v_available, p_quantity),
            'code', 'INSUFFICIENT_STOCK',
            'available', v_available,
            'requested', p_quantity
        );
    END IF;

    -- Reserve the stock
    UPDATE public.products
    SET reserved_quantity = reserved_quantity + p_quantity
    WHERE id = p_product_id;

    -- Log the reservation
    INSERT INTO public.inventory_logs (
        product_id, action, quantity, quantity_before, quantity_after,
        reserved_before, reserved_after, notes
    )
    VALUES (
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create RPC function to decrement stock (after order confirmed)
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
    p_product_id UUID,
    p_quantity INT,
    p_order_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current_stock INT;
    v_current_reserved INT;
    v_result JSONB;
BEGIN
    -- Lock the row for update
    SELECT stock_quantity, reserved_quantity
    INTO v_current_stock, v_current_reserved
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Product not found',
            'code', 'PRODUCT_NOT_FOUND'
        );
    END IF;

    -- Check if enough stock
    IF v_current_stock < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Insufficient stock for decrement. Available: %s, Requested: %s', v_current_stock, p_quantity),
            'code', 'INSUFFICIENT_STOCK',
            'available', v_current_stock,
            'requested', p_quantity
        );
    END IF;

    -- Decrement stock and reserved quantity (assuming reserved stock is being decremented)
    UPDATE public.products
    SET 
        stock_quantity = stock_quantity - p_quantity,
        reserved_quantity = GREATEST(0, reserved_quantity - p_quantity)
    WHERE id = p_product_id;

    -- Log the decrement
    INSERT INTO public.inventory_logs (
        product_id, order_id, action, quantity, quantity_before, quantity_after,
        reserved_before, reserved_after, notes
    )
    VALUES (
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create RPC function to cancel reservation (if order cancelled)
CREATE OR REPLACE FUNCTION public.cancel_stock_reservation(
    p_product_id UUID,
    p_quantity INT,
    p_order_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current_reserved INT;
BEGIN
    -- Lock the row for update
    SELECT reserved_quantity
    INTO v_current_reserved
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Product not found'
        );
    END IF;

    -- Check if enough reserved stock to cancel
    IF v_current_reserved < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Cannot cancel %s units. Only %s reserved', p_quantity, v_current_reserved)
        );
    END IF;

    -- Cancel the reservation
    UPDATE public.products
    SET reserved_quantity = reserved_quantity - p_quantity
    WHERE id = p_product_id;

    -- Log the cancellation
    INSERT INTO public.inventory_logs (
        product_id, order_id, action, quantity, quantity_before, quantity_after,
        reserved_before, reserved_after
    )
    VALUES (
        p_product_id, p_order_id, 'cancel_reservation', p_quantity, 0, 0,
        v_current_reserved, v_current_reserved - p_quantity
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Reservation cancelled',
        'product_id', p_product_id,
        'cancelled_quantity', p_quantity
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create RPC to restore stock on return/refund
CREATE OR REPLACE FUNCTION public.refund_product_stock(
    p_product_id UUID,
    p_quantity INT,
    p_order_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current_stock INT;
BEGIN
    -- Lock the row for update
    SELECT stock_quantity
    INTO v_current_stock
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Product not found'
        );
    END IF;

    -- Restore stock
    UPDATE public.products
    SET stock_quantity = stock_quantity + p_quantity
    WHERE id = p_product_id;

    -- Log the refund
    INSERT INTO public.inventory_logs (
        product_id, order_id, action, quantity, quantity_before, quantity_after, notes
    )
    VALUES (
        p_product_id, p_order_id, 'refund', p_quantity, v_current_stock, v_current_stock + p_quantity,
        p_notes
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Stock refunded successfully',
        'product_id', p_product_id,
        'refunded_quantity', p_quantity,
        'new_stock', v_current_stock + p_quantity
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.reserve_product_stock(UUID, INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(UUID, INT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_stock_reservation(UUID, INT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_product_stock(UUID, INT, UUID, TEXT) TO authenticated;

-- 8. Create low-stock alert view
CREATE OR REPLACE VIEW public.low_stock_products AS
SELECT
    p.id,
    p.name,
    p.store_id,
    s.owner_id,
    s.name as store_name,
    p.stock_quantity,
    p.reserved_quantity,
    (p.stock_quantity - p.reserved_quantity) as available_quantity
FROM public.products p
LEFT JOIN public.stores s ON p.store_id::uuid = s.id
WHERE (p.stock_quantity - p.reserved_quantity) < 5
    AND p.is_active = true;

COMMIT;


-- FILE: 0023_multi_vendor_orders.sql

-- ============================================================
-- Migration 0023: Add Multi-Vendor Order Support
-- Adds per-line-item store tracking for multi-vendor orders
-- ============================================================

-- Add store_id to order_items for per-vendor line item tracking
ALTER TABLE public.order_items 
    ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    ADD COLUMN IF NOT EXISTS tracking_number TEXT,
    ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;

-- Create indexes for querying vendor orders
CREATE INDEX IF NOT EXISTS idx_order_items_store_id ON public.order_items(store_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON public.order_items(status);

-- Update products table to ensure it has is_active column for queries
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

COMMIT;


-- FILE: 0024_fix_inventory_rpc_permissions.sql

-- Fix for inventory RPC permissions to prevent unauthorized access
-- This migration restricts stock management RPC functions to the service_role

-- 1. Replace the functions to explicitly use SECURITY DEFINER and restrict to postgres role
CREATE OR REPLACE FUNCTION reserve_product_stock(p_product_id UUID, p_quantity INTEGER, p_reason TEXT DEFAULT 'Checkout reservation')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF current_setting('request.jwt.claim.role', true) IN ('anon', 'authenticated') THEN
        RAISE EXCEPTION 'Unauthorized: only service_role can call this function directly';
    END IF;

    UPDATE products
    SET 
        stock_quantity = stock_quantity - p_quantity,
        updated_at = NOW()
    WHERE id = p_product_id AND stock_quantity >= p_quantity;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock for product %', p_product_id;
    END IF;

    -- Log reservation
    INSERT INTO inventory_logs (product_id, change_amount, reason)
    VALUES (p_product_id, -p_quantity, p_reason);
    
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_product_stock(p_product_id UUID, p_quantity INTEGER, p_order_id UUID, p_reason TEXT DEFAULT 'Order fulfilled')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF current_setting('request.jwt.claim.role', true) IN ('anon', 'authenticated') THEN
        RAISE EXCEPTION 'Unauthorized: only service_role can call this function directly';
    END IF;

    INSERT INTO inventory_logs (product_id, order_id, change_amount, reason)
    VALUES (p_product_id, p_order_id, 0, p_reason || ' (Stock previously reserved)');
    
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION cancel_stock_reservation(p_product_id UUID, p_quantity INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF current_setting('request.jwt.claim.role', true) IN ('anon', 'authenticated') THEN
        RAISE EXCEPTION 'Unauthorized: only service_role can call this function directly';
    END IF;

    UPDATE products
    SET 
        stock_quantity = stock_quantity + p_quantity,
        updated_at = NOW()
    WHERE id = p_product_id;
    
    -- Log cancellation
    INSERT INTO inventory_logs (product_id, change_amount, reason)
    VALUES (p_product_id, p_quantity, 'Reservation cancelled');
    
    RETURN TRUE;
END;
$$;

-- 2. Revoke existing permissions
REVOKE EXECUTE ON FUNCTION reserve_product_stock(UUID, INTEGER, TEXT) FROM public;
REVOKE EXECUTE ON FUNCTION reserve_product_stock(UUID, INTEGER, TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION reserve_product_stock(UUID, INTEGER, TEXT) FROM anon;

REVOKE EXECUTE ON FUNCTION decrement_product_stock(UUID, INTEGER, UUID, TEXT) FROM public;
REVOKE EXECUTE ON FUNCTION decrement_product_stock(UUID, INTEGER, UUID, TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION decrement_product_stock(UUID, INTEGER, UUID, TEXT) FROM anon;

REVOKE EXECUTE ON FUNCTION cancel_stock_reservation(UUID, INTEGER) FROM public;
REVOKE EXECUTE ON FUNCTION cancel_stock_reservation(UUID, INTEGER) FROM authenticated;
REVOKE EXECUTE ON FUNCTION cancel_stock_reservation(UUID, INTEGER) FROM anon;

-- 3. Grant EXECUTE ONLY to service_role (which backend uses)
GRANT EXECUTE ON FUNCTION reserve_product_stock(UUID, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION decrement_product_stock(UUID, INTEGER, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION cancel_stock_reservation(UUID, INTEGER) TO service_role;


-- FILE: 0025_fix_store_id_type.sql

-- Fix store_id type in products and orders tables to be UUID

-- 0. Drop views that depend on store_id
DROP VIEW IF EXISTS public.products_with_stores CASCADE;

-- 1. Drop policies that depend on store_id
DROP POLICY IF EXISTS "Vendors can insert their own products" ON public.products;
DROP POLICY IF EXISTS "Vendors can update their own products" ON public.products;
DROP POLICY IF EXISTS "Vendors can delete their own products" ON public.products;
DROP POLICY IF EXISTS "Vendors can view their store orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors can update their store orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors can view their store order items" ON public.order_items;

-- 2. Convert products.store_id from text to uuid
ALTER TABLE public.products
  ALTER COLUMN store_id TYPE UUID USING store_id::uuid;

-- Add foreign key constraint to products.store_id
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_store_id_fkey,
  ADD CONSTRAINT products_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

-- 3. Convert orders.store_id from text to uuid
ALTER TABLE public.orders
  ALTER COLUMN store_id TYPE UUID USING store_id::uuid;

-- Add foreign key constraint to orders.store_id
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_store_id_fkey,
  ADD CONSTRAINT orders_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE SET NULL;

-- 4. Recreate policies without the ::uuid cast

-- Products Policies
CREATE POLICY "Vendors can insert their own products" ON public.products
  FOR INSERT
  WITH CHECK (
    store_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.stores 
      WHERE stores.id = products.store_id 
      AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update their own products" ON public.products
  FOR UPDATE
  USING (
    store_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.stores 
      WHERE stores.id = products.store_id 
      AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can delete their own products" ON public.products
  FOR DELETE
  USING (
    store_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.stores 
      WHERE stores.id = products.store_id 
      AND stores.owner_id = auth.uid()
    )
  );

-- Orders Policies
CREATE POLICY "Vendors can view their store orders" ON public.orders
  FOR SELECT
  USING (
    store_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.stores 
      WHERE stores.id = orders.store_id 
      AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update their store orders" ON public.orders
  FOR UPDATE
  USING (
    store_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.stores 
      WHERE stores.id = orders.store_id 
      AND stores.owner_id = auth.uid()
    )
  );

-- Order Items Policies
CREATE POLICY "Vendors can view their store order items" ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      JOIN public.stores ON stores.id = orders.store_id
      WHERE orders.id = order_items.order_id 
      AND stores.owner_id = auth.uid()
    )
  );

-- 5. Recreate views

CREATE OR REPLACE VIEW public.products_with_stores AS
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
FROM
    public.products p
LEFT JOIN
    public.stores s ON p.store_id = s.id;


-- FILE: 0026_get_category_counts.sql

-- Create RPC to get product counts by category

CREATE OR REPLACE FUNCTION get_category_counts()
RETURNS TABLE (category TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT products.category::TEXT, COUNT(*) AS count
    FROM products
    WHERE products.category IS NOT NULL
    GROUP BY products.category;
END;
$$;


-- FILE: 0027_harmonize_stock_column.sql

-- Migration 0027: Harmonize stock column naming
-- Renames stock_quantity to stock if needed and updates all dependent RPC functions and views.

DO $$
BEGIN
    -- 1. Rename stock_quantity to stock if it exists and stock doesn't
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock_quantity') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock') THEN
        ALTER TABLE public.products RENAME COLUMN stock_quantity TO stock;
    
    -- 2. If both exist, we might need to sync them, but for safety we'll just ensure stock has the constraints
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock_quantity') 
          AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock') THEN
        -- Sync stock from stock_quantity if stock is 0/null and stock_quantity has data
        UPDATE public.products SET stock = stock_quantity WHERE (stock IS NULL OR stock = 0) AND stock_quantity > 0;
        -- Optionally drop stock_quantity later, but let's keep it for now for safety
    END IF;

    -- 3. Ensure reserved_quantity exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'reserved_quantity') THEN
        ALTER TABLE public.products ADD COLUMN reserved_quantity INT DEFAULT 0 CHECK (reserved_quantity >= 0);
    END IF;
END $$;

-- 2. Ensure constraints on 'stock'
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS check_stock_not_negative;
ALTER TABLE public.products ADD CONSTRAINT check_stock_not_negative CHECK (stock >= 0);

-- 3. Ensure inventory_logs exists
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    quantity INT NOT NULL,
    quantity_before INT NOT NULL,
    quantity_after INT NOT NULL,
    reserved_before INT DEFAULT 0,
    reserved_after INT DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Update RPC functions to use 'stock' instead of 'stock_quantity'
-- We must drop them first because we are changing the return type from BOOLEAN to JSONB

DROP FUNCTION IF EXISTS public.reserve_product_stock(UUID, INT, TEXT);
DROP FUNCTION IF EXISTS public.decrement_product_stock(UUID, INT, UUID, TEXT);
DROP FUNCTION IF EXISTS public.cancel_stock_reservation(UUID, INT);
DROP FUNCTION IF EXISTS public.cancel_stock_reservation(UUID, INT, UUID);
DROP FUNCTION IF EXISTS public.refund_product_stock(UUID, INT, UUID, TEXT);

-- reserve_product_stock
CREATE OR REPLACE FUNCTION public.reserve_product_stock(
    p_product_id UUID,
    p_quantity INT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current_stock INT;
    v_current_reserved INT;
    v_available INT;
BEGIN
    -- Lock the row for update
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
    )
    VALUES (
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- decrement_product_stock
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
    p_product_id UUID,
    p_quantity INT,
    p_order_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
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
            'error', format('Insufficient stock for decrement. Available: %s, Requested: %s', v_current_stock, p_quantity),
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
    )
    VALUES (
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- cancel_stock_reservation
CREATE OR REPLACE FUNCTION public.cancel_stock_reservation(
    p_product_id UUID,
    p_quantity INT,
    p_order_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current_reserved INT;
BEGIN
    -- Lock the row for update
    SELECT reserved_quantity
    INTO v_current_reserved
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
    )
    VALUES (
        p_product_id, p_order_id, 'cancel_reservation', p_quantity, 0, 0,
        v_current_reserved, v_current_reserved - p_quantity
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Reservation cancelled',
        'product_id', p_product_id,
        'cancelled_quantity', p_quantity
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- refund_product_stock
CREATE OR REPLACE FUNCTION public.refund_product_stock(
    p_product_id UUID,
    p_quantity INT,
    p_order_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
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
    )
    VALUES (
        p_product_id, p_order_id, 'refund', p_quantity, v_current_stock, v_current_stock + p_quantity,
        p_notes
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Stock refunded successfully',
        'product_id', p_product_id,
        'refunded_quantity', p_quantity,
        'new_stock', v_current_stock + p_quantity
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update low_stock_products view
CREATE OR REPLACE VIEW public.low_stock_products AS
SELECT
    p.id,
    p.name,
    p.store_id,
    s.owner_id,
    s.name as store_name,
    p.stock,
    p.reserved_quantity,
    (p.stock - p.reserved_quantity) as available_quantity
FROM public.products p
LEFT JOIN public.stores s ON p.store_id = s.id
WHERE (p.stock - p.reserved_quantity) < 5
    AND s.is_active = true;


-- FILE: 0028_fix_order_visibility_and_contact.sql

-- Migration 0028: Fix Order Visibility and multi-vendor access

-- 1. Update RLS policies for 'orders' table to allow vendors to see orders
-- if they have items in that order, even if they aren't the primary store_id.
DROP POLICY IF EXISTS "Vendors can view their store orders" ON public.orders;
CREATE POLICY "Vendors can view their store orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.order_items
      JOIN public.stores ON order_items.store_id = stores.id
      WHERE order_items.order_id = orders.id
        AND stores.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vendors can update their store orders" ON public.orders;
CREATE POLICY "Vendors can update their store orders" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.order_items
      JOIN public.stores ON order_items.store_id = stores.id
      WHERE order_items.order_id = orders.id
        AND stores.owner_id = auth.uid()
    )
  );

-- 2. Update RLS policies for 'order_items' table to allow vendors to view their own items
DROP POLICY IF EXISTS "Vendors can view their store order items" ON public.order_items;
CREATE POLICY "Vendors can view their store order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = order_items.store_id
        AND stores.owner_id = auth.uid()
    )
  );

-- 3. Ensure 'order_items' update policy exists for vendors (to change status)
DROP POLICY IF EXISTS "Vendors can update their store order items" ON public.order_items;
CREATE POLICY "Vendors can update their store order items" ON public.order_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = order_items.store_id
        AND stores.owner_id = auth.uid()
    )
  );

-- 4. Allow users to update their own orders (to confirm receipt)
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
CREATE POLICY "Users can update their own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id);


-- FILE: 0029_ensure_order_items_columns.sql

-- ============================================================
-- Migration 0029: Ensure order_items columns exist
-- Safely adds status, tracking_number, shipped_at, store_id
-- to order_items in case 0023 was not applied to the live DB.
-- ============================================================

-- Add status column with constraint
ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add the check constraint only if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'order_items_status_check'
          AND conrelid = 'public.order_items'::regclass
    ) THEN
        ALTER TABLE public.order_items
            ADD CONSTRAINT order_items_status_check
            CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'));
    END IF;
END $$;

-- Add remaining columns
ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS tracking_number TEXT,
    ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_order_items_store_id ON public.order_items(store_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON public.order_items(status);

-- Ensure is_active column on products (also from 0023)
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ============================================================
-- Fix RLS for order_items so vendors can view & update
-- their items via store_id (not just via orders.store_id)
-- ============================================================

DROP POLICY IF EXISTS "Vendors can view their store order items" ON public.order_items;
CREATE POLICY "Vendors can view their store order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = order_items.store_id
        AND stores.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vendors can update their store order items" ON public.order_items;
CREATE POLICY "Vendors can update their store order items" ON public.order_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = order_items.store_id
        AND stores.owner_id = auth.uid()
    )
  );

-- ============================================================
-- Fix orders RLS so vendors see orders with their items
-- ============================================================

DROP POLICY IF EXISTS "Vendors can view their store orders" ON public.orders;
CREATE POLICY "Vendors can view their store orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.order_items
      JOIN public.stores ON order_items.store_id = stores.id
      WHERE order_items.order_id = orders.id
        AND stores.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vendors can update their store orders" ON public.orders;
CREATE POLICY "Vendors can update their store orders" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.order_items
      JOIN public.stores ON order_items.store_id = stores.id
      WHERE order_items.order_id = orders.id
        AND stores.owner_id = auth.uid()
    )
  );

-- Allow customers to update their own orders (confirm receipt / cancel)
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
CREATE POLICY "Users can update their own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow customers to update their own order items (via order ownership)
DROP POLICY IF EXISTS "Users can update their own order items" ON public.order_items;
CREATE POLICY "Users can update their own order items" ON public.order_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );


-- FILE: 0030_discount_code_product_id.sql

-- ============================================================
-- Migration 0030: Product-specific discount codes
-- Adds product_id to discount_codes for item-level discounts.
-- Also ensures store_id exists for vendor-scoped management.
-- ============================================================

-- Add store_id to discount_codes if it doesn't exist
ALTER TABLE public.discount_codes
    ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

-- Add product_id to discount_codes (NULL = applies to entire cart)
ALTER TABLE public.discount_codes
    ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE CASCADE;

-- Rename min_purchase_amount to min_order_amount for consistency if needed
-- (safely done only if column doesn't exist yet)
ALTER TABLE public.discount_codes
    ADD COLUMN IF NOT EXISTS min_order_amount NUMERIC DEFAULT 0;

-- Index for store-scoped lookups
CREATE INDEX IF NOT EXISTS idx_discount_codes_store_id ON public.discount_codes(store_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_product_id ON public.discount_codes(product_id);

-- ============================================================
-- Update RLS: Vendors can manage their own discount codes
-- ============================================================

DROP POLICY IF EXISTS "Admins can manage discount codes" ON public.discount_codes;
DROP POLICY IF EXISTS "Vendors can manage their discount codes" ON public.discount_codes;
DROP POLICY IF EXISTS "Public can read discount codes" ON public.discount_codes;

-- Anyone can read discount codes (needed for checkout validation)
CREATE POLICY "Public can read discount codes" ON public.discount_codes
  FOR SELECT USING (true);

-- Vendors can insert discount codes for their own store
CREATE POLICY "Vendors can insert their discount codes" ON public.discount_codes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = discount_codes.store_id
        AND stores.owner_id = auth.uid()
    )
  );

-- Vendors can update their own discount codes
CREATE POLICY "Vendors can update their discount codes" ON public.discount_codes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = discount_codes.store_id
        AND stores.owner_id = auth.uid()
    )
  );

-- Vendors can delete their own discount codes
CREATE POLICY "Vendors can delete their discount codes" ON public.discount_codes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = discount_codes.store_id
        AND stores.owner_id = auth.uid()
    )
  );

-- Admins retain full access
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


-- FILE: 0031_fix_all_advisor_issues.sql

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


-- FILE: 0032_fix_remaining_advisor_warnings.sql

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


-- FILE: 0033_definitive_rls_consolidation.sql

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


-- FILE: 0034_audit_fixes.sql

-- ============================================================
-- PHASE 1: Fix duplicate/stale RLS policies on categories
-- ============================================================

DROP POLICY IF EXISTS "Categories are publicly viewable" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
-- Keeping: "Categories/* */are/* */publicly/* */viewable" (SELECT true)
-- Keeping: "Admins/* */can/* */manage/* */categories" (ALL for admins)

-- ============================================================
-- PHASE 2: Fix duplicate RLS on product_variants
-- ============================================================

DROP POLICY IF EXISTS "Product variants are publicly viewable" ON public.product_variants;
DROP POLICY IF EXISTS "Vendors can insert their product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Vendors can update their product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Vendors can delete their product variants" ON public.product_variants;
-- Keeping: "Product/* */variants/* */are/* */publicly/* */viewable" (SELECT true)
-- Keeping: "Vendors/* */can/* */manage/* */their/* */product/* */variants" (ALL)

-- ============================================================
-- PHASE 3: Fix inventory_logs broad SELECT policy
-- ============================================================

DROP POLICY IF EXISTS "Inventory/* */logs/* */are/* */viewable/* */by/* */authenticate" 
  ON public.inventory_logs;
-- Keeping only: "Vendors and admins can view inventory logs"

-- ============================================================
-- PHASE 4: Fix profiles public exposure
-- ============================================================

DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;

CREATE POLICY "Profiles: public fields viewable" ON public.profiles
  FOR SELECT USING (true);
-- Note: keeping it open but recommended to use a specific view for profile data

-- ============================================================
-- PHASE 5: Add missing indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_orders_user_id 
  ON public.orders(user_id);

CREATE INDEX IF NOT EXISTS idx_orders_status 
  ON public.orders(status);

CREATE INDEX IF NOT EXISTS idx_orders_created_at 
  ON public.orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
  ON public.order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id 
  ON public.inventory_logs(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_order_id 
  ON public.inventory_logs(order_id);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id 
  ON public.reviews(product_id);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id 
  ON public.reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id 
  ON public.wishlist(user_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_product_id 
  ON public.wishlist(product_id);

CREATE INDEX IF NOT EXISTS idx_products_category_id 
  ON public.products(category_id);

CREATE INDEX IF NOT EXISTS idx_stores_owner_id 
  ON public.stores(owner_id);

-- ============================================================
-- PHASE 6: Add orders.notes column (replace map_link abuse)
-- ============================================================

ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid';

-- ============================================================
-- PHASE 7: Fix discount_codes usage (atomic increment)
-- ============================================================

-- Replace client-side read+write with DB function
CREATE OR REPLACE FUNCTION public.increment_discount_usage(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE public.discount_codes
  SET current_uses = current_uses + 1
  WHERE code = UPPER(p_code)
    AND is_active = true
    AND (valid_until IS NULL OR valid_until >= now())
    AND (max_uses IS NULL OR current_uses < max_uses)
  ;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_discount_usage TO authenticated;

-- ============================================================
-- PHASE 8: Add unique constraint on vendor_applications
-- ============================================================

-- Prevent duplicate pending applications per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_application
  ON public.vendor_applications(user_id)
  WHERE status = 'pending';

-- ============================================================
-- PHASE 9: Create payments table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  method TEXT NOT NULL DEFAULT 'cash_on_delivery',
  status TEXT NOT NULL DEFAULT 'pending',
  transaction_ref TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
        AND orders.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admins can manage payments" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);

-- ============================================================
-- PHASE 10: Create carts table for server-side persistence
-- ============================================================

CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  discount_code TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cart" ON public.carts
  FOR ALL USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================
-- PHASE 11: Ensure low_stock_products view exists
-- ============================================================

DROP VIEW IF EXISTS public.low_stock_products;

CREATE VIEW public.low_stock_products AS
SELECT 
  p.id,
  p.name,
  p.stock,
  COALESCE(p.reserved_quantity, 0) AS reserved_quantity,
  p.stock - COALESCE(p.reserved_quantity, 0) AS available_stock,
  s.owner_id,
  s.name AS store_name,
  s.id AS store_id
FROM public.products p
JOIN public.stores s ON s.id = p.store_id
WHERE (p.stock - COALESCE(p.reserved_quantity, 0)) < 5
  AND p.stock >= 0;

-- ============================================================
-- PHASE 12: Fix orders.email - make it nullable  
-- ============================================================

ALTER TABLE public.orders 
  ALTER COLUMN email DROP NOT NULL;

ALTER TABLE public.orders
  ALTER COLUMN email SET DEFAULT NULL;
