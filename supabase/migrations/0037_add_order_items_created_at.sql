-- Migration: 0037_add_order_items_created_at.sql
-- Description: Adds created_at column to order_items for proper sorting and auditing.

-- 1. Add created_at column with default now()
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 2. Populate existing order_items created_at from their parent orders
UPDATE public.order_items oi
SET created_at = o.created_at
FROM public.orders o
WHERE oi.order_id = o.id
AND oi.created_at IS NULL;

-- 3. Ensure it's not null going forward
ALTER TABLE public.order_items 
ALTER COLUMN created_at SET NOT NULL;

-- 4. Add index for sorting
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON public.order_items(created_at DESC);
