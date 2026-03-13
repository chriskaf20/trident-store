-- ============================================================
-- 0013_approve_vendor_role.sql
-- Creates a secure RPC function for admins to update a user's role.
-- Bypasses the recursive RLS issues on the `profiles` table.
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_update_user_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Verify caller is an admin
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    -- Update the role
    UPDATE public.profiles
    SET role = new_role
    WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized: Caller is not an admin.';
  END IF;
END;
$$;
