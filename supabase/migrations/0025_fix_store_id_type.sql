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
