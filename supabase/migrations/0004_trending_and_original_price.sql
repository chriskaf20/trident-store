-- Migration: Add is_trending and original_price to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2) DEFAULT NULL;

-- Update some existing products to be trending (if any exist)
-- Admin can set these via the dashboard
