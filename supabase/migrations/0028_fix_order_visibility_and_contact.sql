-- Migration 0028: Fix Order Visibility and multi-vendor access

-- 1. Update RLS policies for 'orders' table to allow vendors to see orders
-- if they have items in that order, even if they aren't the primary store_id.
DROP POLICY IF EXISTS "Vendors can view their store orders" ON public.orders;
CREATE POLICY "Vendors can view their store orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.order_items
      JOIN public.stores ON order_items.store_id = stores.id
      WHERE order_items.order_id = orders.id
        AND stores.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vendors can update their store orders" ON public.orders;
CREATE POLICY "Vendors can update their store orders" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.order_items
      JOIN public.stores ON order_items.store_id = stores.id
      WHERE order_items.order_id = orders.id
        AND stores.owner_id = auth.uid()
    )
  );

-- 2. Update RLS policies for 'order_items' table to allow vendors to view their own items
DROP POLICY IF EXISTS "Vendors can view their store order items" ON public.order_items;
CREATE POLICY "Vendors can view their store order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = order_items.store_id
        AND stores.owner_id = auth.uid()
    )
  );

-- 3. Ensure 'order_items' update policy exists for vendors (to change status)
DROP POLICY IF EXISTS "Vendors can update their store order items" ON public.order_items;
CREATE POLICY "Vendors can update their store order items" ON public.order_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = order_items.store_id
        AND stores.owner_id = auth.uid()
    )
  );

-- 4. Allow users to update their own orders (to confirm receipt)
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
CREATE POLICY "Users can update their own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id);
