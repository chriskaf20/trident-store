-- Add fit_rating column to reviews for fit feedback feature.
-- Allowed values: 'runs_small', 'true_to_size', 'runs_large', or NULL.
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS fit_rating text
  CHECK (fit_rating IN ('runs_small', 'true_to_size', 'runs_large'));
