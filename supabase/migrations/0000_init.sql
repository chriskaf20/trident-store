-- 1. Create a trigger to automatically insert a profile when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'customer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Setup Row Level Security (RLS) for public.products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone can view products
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Products are viewable by everyone" ON public.products
  FOR SELECT USING (true);

-- Only authenticated vendors can insert products for their store
DROP POLICY IF EXISTS "Vendors can insert their own products" ON public.products;
CREATE POLICY "Vendors can insert their own products" ON public.products
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT owner_id FROM public.stores WHERE stores.id = products.store_id
    )
  );

-- Only authenticated vendors can update their own products
DROP POLICY IF EXISTS "Vendors can update their own products" ON public.products;
CREATE POLICY "Vendors can update their own products" ON public.products
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT owner_id FROM public.stores WHERE stores.id = products.store_id
    )
  );

-- Only authenticated vendors can delete their own products
DROP POLICY IF EXISTS "Vendors can delete their own products" ON public.products;
CREATE POLICY "Vendors can delete their own products" ON public.products
  FOR DELETE USING (
    auth.uid() IN (
      SELECT owner_id FROM public.stores WHERE stores.id = products.store_id
    )
  );

-- 3. Setup Row Level Security (RLS) for public.orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Customers can view their own orders
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- Customers can insert their own orders
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Users can insert their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Vendors can view orders for their store
DROP POLICY IF EXISTS "Vendors can view their store orders" ON public.orders;
CREATE POLICY "Vendors can view their store orders" ON public.orders
  FOR SELECT USING (
    auth.uid() IN (
      SELECT owner_id FROM public.stores WHERE stores.id = orders.store_id
    )
  );

-- Vendors can update orders for their store (e.g., status changes)
DROP POLICY IF EXISTS "Vendors can update their store orders" ON public.orders;
CREATE POLICY "Vendors can update their store orders" ON public.orders
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT owner_id FROM public.stores WHERE stores.id = orders.store_id
    )
  );
