-- =========================================================================================
-- MIGRATION: 0036_fix_function_permissions.sql
-- PURPOSE: Fixes the role recognition issue by granting necessary EXECUTE permissions 
--          to the authenticated role. The previous migration revoked execution from PUBLIC 
--          for security definer functions, which inadvertently blocked authenticated users 
--          from evaluating RLS policies that rely on these functions (like is_admin()).
-- =========================================================================================

-- Grant execute to authenticated users for functions used in RLS or by the application
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- The following functions are used during checkout or by vendors/admins.
-- They must be accessible to authenticated users.
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.approve_vendor_application(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reject_vendor_application(uuid, uuid, text) TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.reserve_product_stock(uuid, integer, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(uuid, integer, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_stock_reservation(uuid, integer, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.refund_product_stock(uuid, integer, uuid, text) TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.increment_discount_usage(text) TO authenticated, service_role;

-- get_category_counts is used on the public storefront, so anon needs it too.
GRANT EXECUTE ON FUNCTION public.get_category_counts() TO anon, authenticated, service_role;

-- Note: handle_new_user() is triggered by Supabase Auth and should NOT be executable by users.
-- We leave it as revoked from anon and authenticated.
