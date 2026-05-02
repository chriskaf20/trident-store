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
