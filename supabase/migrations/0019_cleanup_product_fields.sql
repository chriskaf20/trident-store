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
