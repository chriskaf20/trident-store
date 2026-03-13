-- ============================================================
-- 0011_admin_profile_update.sql
-- Fixes issue where Admins cannot approve a vendor because
-- the RLS policy on `profiles` only allows users to update
-- their own profile. Adding a policy for Admins to update any profile.
-- ============================================================

-- Add policy to allow admins to update profiles (e.g. changing role from 'customer' to 'vendor')
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Also ensure admins have a fallback policy for selecting profiles,
-- just in case the "Profiles are publicly viewable" policy gets removed.
DROP POLICY IF EXISTS "Admins can view any profile" ON public.profiles;

CREATE POLICY "Admins can view any profile" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
