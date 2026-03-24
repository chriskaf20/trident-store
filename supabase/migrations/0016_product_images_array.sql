-- Add images array column to products for multi-image gallery support.
-- The existing `image` column is kept as the primary/fallback image.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';
