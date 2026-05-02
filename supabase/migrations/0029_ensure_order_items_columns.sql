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
