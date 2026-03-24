-- Migration: Add product variant fields (Simplified)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sizes        text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS colors       jsonb   DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS tags         text[]  DEFAULT '{}';
