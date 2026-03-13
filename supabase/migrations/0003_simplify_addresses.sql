-- Update addresses table to simplify the address fields according to user request

-- Drop the columns we no longer need (city, state, zip_code, country)
ALTER TABLE public.addresses
DROP COLUMN IF EXISTS city,
DROP COLUMN IF EXISTS state,
DROP COLUMN IF EXISTS zip_code,
DROP COLUMN IF EXISTS country;

-- Add the new requested columns
ALTER TABLE public.addresses
ADD COLUMN IF NOT EXISTS apartment_door TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS map_location_link TEXT;
