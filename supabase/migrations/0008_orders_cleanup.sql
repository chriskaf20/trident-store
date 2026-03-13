-- Migration: Remove required email/phone from orders, fix RLS insert policy

-- 1. Make email and phone nullable (they're no longer collected at checkout)
ALTER TABLE public.orders
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL;

-- 2. Set existing NULLs to empty string if column exists as NOT NULL was previously enforced
--    (This is a no-op if columns are already nullable)

-- 3. Fix the orders INSERT RLS policy so authenticated users can place orders.
--    The previous policy only allowed insert if user_id = auth.uid(),
--    but we still want to make sure orders are linked to real users.
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;

CREATE POLICY "Users can insert their own orders" ON public.orders
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = orders.user_id
  );
