-- ============================================================
-- SEED: Create store + products for testing
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- STEP 1: Create a store linked to YOUR admin user
-- (This uses your logged-in admin account as the store owner)
DO $$
DECLARE
  admin_id UUID;
  new_store_id UUID;
BEGIN
  -- Get the first admin user
  SELECT id INTO admin_id FROM public.profiles WHERE role = 'admin' LIMIT 1;

  IF admin_id IS NULL THEN
    -- Fallback: use first user in auth
    SELECT id INTO admin_id FROM auth.users LIMIT 1;
  END IF;

  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'No user found. Please sign up/in first.';
  END IF;

  -- Check if a store already exists for this user
  SELECT id INTO new_store_id FROM public.stores WHERE owner_id = admin_id LIMIT 1;

  IF new_store_id IS NULL THEN
    INSERT INTO public.stores (owner_id, name, slug, description, is_active)
    VALUES (admin_id, 'Trident Official', 'trident-official', 'The official Trident flagship store.', true)
    RETURNING id INTO new_store_id;
    RAISE NOTICE 'Created store with id: %', new_store_id;
  ELSE
    RAISE NOTICE 'Store already exists with id: %', new_store_id;
  END IF;

  -- STEP 2: Insert products (only if not already seeded)
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE store_id = new_store_id::text LIMIT 1) THEN

    -- Women's Collection
    INSERT INTO public.products (store_id, name, description, price, original_price, category, stock_quantity, images, is_trending) VALUES
    (new_store_id::text, 'Silk Wrap Midi Dress', 'Elegant wrap-style midi dress in ivory silk blend.', 89.99, 129.00, 'Women', 25, ARRAY['https://images.unsplash.com/photo-1612336307429-8a898d10e223?q=80&w=600'], true),
    (new_store_id::text, 'Oversized Blazer Co-Ord', 'Matching blazer and trouser set in camel.', 119.00, 165.00, 'Women', 18, ARRAY['https://images.unsplash.com/photo-1594938298603-c8148c4b4463?q=80&w=600'], false),
    (new_store_id::text, 'Floral Chiffon Blouse', 'Lightweight chiffon blouse with cascading floral print.', 45.00, 65.00, 'Women', 30, ARRAY['https://images.unsplash.com/photo-1551163943-3f7253a97845?q=80&w=600'], true),
    (new_store_id::text, 'High-Waist Wide Leg Jeans', 'Premium denim in classic indigo.', 79.00, null, 'Women', 22, ARRAY['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600'], false),
    (new_store_id::text, 'Knit Ribbed Midi Skirt', 'Ribbed stretch knit midi skirt in chocolate brown.', 55.00, 75.00, 'Women', 15, ARRAY['https://images.unsplash.com/photo-1582533561751-ef6f59c8b2e1?q=80&w=600'], false),
    (new_store_id::text, 'Linen Shirt Dress', 'Relaxed linen shirt dress in crisp white.', 68.00, null, 'Women', 20, ARRAY['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=600'], true);

    -- Men's Collection
    INSERT INTO public.products (store_id, name, description, price, original_price, category, stock_quantity, images, is_trending) VALUES
    (new_store_id::text, 'Slim-Fit Oxford Shirt', 'Classic oxford cotton shirt in pale blue.', 55.00, 80.00, 'Men', 30, ARRAY['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=600'], true),
    (new_store_id::text, 'Slim-Cut Chino Trousers', 'Stretch cotton chino in slate grey.', 69.00, 95.00, 'Men', 20, ARRAY['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=600'], false),
    (new_store_id::text, 'Technical Harrington Jacket', 'Lightweight technical water-resistant jacket.', 125.00, 175.00, 'Men', 12, ARRAY['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600'], true),
    (new_store_id::text, 'Heavy Wash Denim Jacket', 'Acid-washed denim jacket with distressed details.', 89.00, null, 'Men', 18, ARRAY['https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?q=80&w=600'], false),
    (new_store_id::text, 'Premium Pique Polo', 'Classic polo in premium cotton pique.', 45.00, 65.00, 'Men', 35, ARRAY['https://images.unsplash.com/photo-1571945153237-4929e783af4a?q=80&w=600'], false),
    (new_store_id::text, 'Oversized Graphic Tee', 'Dropped-shoulder tee with bold abstract graphic.', 35.00, 50.00, 'Men', 40, ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600'], true);

    -- Accessories
    INSERT INTO public.products (store_id, name, description, price, original_price, category, stock_quantity, images, is_trending) VALUES
    (new_store_id::text, 'Midnight Chronograph Watch', 'Stainless steel chronograph, sapphire crystal.', 350.00, 450.00, 'Accessories', 8, ARRAY['https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=600'], true),
    (new_store_id::text, 'Mini Leather Crossbody Bag', 'Genuine leather crossbody in tan.', 95.00, 130.00, 'Accessories', 14, ARRAY['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=600'], true),
    (new_store_id::text, 'Aviator Sunglasses', 'Classic gold-frame aviators, UV400 protection.', 65.00, 90.00, 'Accessories', 25, ARRAY['https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=600'], false),
    (new_store_id::text, 'Cashmere Blend Scarf', '100% cashmere-blend scarf in camel check.', 55.00, null, 'Accessories', 20, ARRAY['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?q=80&w=600'], false),
    (new_store_id::text, 'Leather Card Wallet', 'Slim bifold wallet in full-grain Italian leather.', 45.00, 60.00, 'Accessories', 30, ARRAY['https://images.unsplash.com/photo-1627123424574-724758594785?q=80&w=600'], false),
    (new_store_id::text, 'Tortoiseshell Bucket Hat', 'Premium woven bucket hat.', 35.00, null, 'Accessories', 22, ARRAY['https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?q=80&w=600'], true);

    RAISE NOTICE 'Products seeded successfully for store: %', new_store_id;
  ELSE
    RAISE NOTICE 'Products already exist for store: %. Skipping seed.', new_store_id;
  END IF;

END $$;
