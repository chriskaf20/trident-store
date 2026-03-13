-- Migration: Add map_link to orders, drop city and postal_code if they exist
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS map_link TEXT DEFAULT NULL;

-- Drop old fields if they exist (safe with IF EXISTS)
ALTER TABLE orders
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS postal_code,
  DROP COLUMN IF EXISTS country;
