-- ============================================================
-- 0012_fix_profiles_recursion.sql
-- Fixes infinite recursion issue in the `profiles` table.
-- The previous migration `0011_admin_profile_update.sql`
-- introduced policies that queried the `profiles` table,
-- causing an infinite loop. This uses `public.is_admin()` instead.
-- ============================================================

-- Fix infinite recursion caused by previous profile policies
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view any profile" ON public.profiles;

-- Use the existing SECURITY DEFINER function to prevent infinite recursion
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (
    public.is_admin()
  )
  WITH CHECK (
    public.is_admin()
  );

CREATE POLICY "Admins can view any profile" ON public.profiles
  FOR SELECT USING (
    public.is_admin()
  );
