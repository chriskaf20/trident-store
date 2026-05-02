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
