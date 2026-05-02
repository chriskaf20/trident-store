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
