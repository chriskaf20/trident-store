-- =========================================================================================
-- MIGRATION: 0038_final_architecture.sql
-- PURPOSE: Complete architectural overhaul for multi-vendor production marketplace.
-- =========================================================================================

-- PHASE 1: SAFE RESET
-- Drops views/functions that might block table drops.
DROP VIEW IF EXISTS public.low_stock_products CASCADE;
DROP VIEW IF EXISTS public.products_with_stores CASCADE;
DROP FUNCTION IF EXISTS public.reserve_product_stock CASCADE;
DROP FUNCTION IF EXISTS public.decrement_product_stock CASCADE;
DROP FUNCTION IF EXISTS public.cancel_stock_reservation CASCADE;
DROP FUNCTION IF EXISTS public.refund_product_stock CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.approve_vendor_role(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.increment_discount_usage(text) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_category_counts() CASCADE;

-- Drop Storage Policies that depend on profiles.role (prevents type alteration error)
DROP POLICY IF EXISTS "Vendors can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Vendors can update own product images" ON storage.objects;
DROP POLICY IF EXISTS "Vendors can delete own product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all storage" ON storage.objects;

-- Drop ALL policies on public.profiles to prevent type alteration errors
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: public fields viewable" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Users and admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- Drop legacy and newly created tables (Keeping public.profiles to preserve existing user roles)
DROP TABLE IF EXISTS public.inventory_logs CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.vendor_orders CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE; -- ADDED: Drop transactions if it exists
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.product_variants CASCADE;
DROP TABLE IF EXISTS public.discount_codes CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.vendor_applications CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.vendors CASCADE; -- Drop vendors if it exists
DROP TABLE IF EXISTS public.carts CASCADE;
DROP TABLE IF EXISTS public.addresses CASCADE;

-- PHASE 2: NEW ENUMS & TYPES
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('customer', 'vendor', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'failed', 'cancelled', 'refunded');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fulfillment_status') THEN
        CREATE TYPE public.fulfillment_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE public.transaction_type AS ENUM ('payment', 'commission', 'payout', 'refund');
    END IF;
END $$;

-- PHASE 3: CORE TABLES

-- Hardening Profiles (Safer Conversion)
ALTER TABLE IF EXISTS public.profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE IF EXISTS public.profiles RENAME COLUMN role TO role_old;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN role public.user_role DEFAULT 'customer'::public.user_role;
UPDATE public.profiles SET role = role_old::public.user_role;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN role_old;
ALTER TABLE IF EXISTS public.profiles ALTER COLUMN role SET NOT NULL;

-- Vendors (Replacing 'stores')
CREATE TABLE public.vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    commission_rate NUMERIC(5,2) DEFAULT 10.00,
    status TEXT DEFAULT 'active', -- active, suspended, pending
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    status TEXT DEFAULT 'active', -- draft, active, archived
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. "Red / XL"
    sku TEXT UNIQUE,
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    weight_grams INTEGER DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- shipping, billing
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'KE',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PHASE 4: ORDERS & TRANSACTIONS

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    shipping_amount NUMERIC(12,2) DEFAULT 0,
    status public.order_status DEFAULT 'pending',
    shipping_address_id UUID REFERENCES public.addresses(id),
    payment_intent_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.vendor_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    subtotal NUMERIC(12,2) NOT NULL,
    commission_amount NUMERIC(12,2) NOT NULL,
    status public.fulfillment_status DEFAULT 'pending',
    tracking_number TEXT,
    carrier TEXT,
    shipped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_order_id UUID NOT NULL REFERENCES public.vendor_orders(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    total_price NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL,
    type public.transaction_type NOT NULL,
    reference_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PHASE 5: INVENTORY LOGIC (RPCs)

CREATE OR REPLACE FUNCTION public.reserve_variant_stock(p_variant_id UUID, p_quantity INTEGER)
RETURNS JSONB AS $$
DECLARE
    v_stock INTEGER;
    v_reserved INTEGER;
BEGIN
    SELECT stock_quantity, reserved_quantity INTO v_stock, v_reserved
    FROM public.product_variants WHERE id = p_variant_id FOR UPDATE;

    IF (v_stock - v_reserved) < p_quantity THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient stock', 'code', 'OUT_OF_STOCK');
    END IF;

    UPDATE public.product_variants 
    SET reserved_quantity = reserved_quantity + p_quantity
    WHERE id = p_variant_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_variant_stock(p_variant_id UUID, p_quantity INTEGER, p_order_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
BEGIN
    UPDATE public.product_variants 
    SET stock_quantity = stock_quantity - p_quantity,
        reserved_quantity = GREATER(0, reserved_quantity - p_quantity)
    WHERE id = p_variant_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PHASE 6: SECURITY (RLS)

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
  SELECT role::text = 'admin' FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

CREATE POLICY "Vendors manage own store" ON public.vendors FOR ALL USING (owner_id = auth.uid() OR public.is_admin());
CREATE POLICY "Public view active products" ON public.products FOR SELECT USING (status = 'active' OR public.is_admin());
CREATE POLICY "Vendors manage own products" ON public.products FOR ALL USING (vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid()) OR public.is_admin());
CREATE POLICY "Customers view own orders" ON public.orders FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Vendors view own sub-orders" ON public.vendor_orders FOR SELECT USING (vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid()) OR public.is_admin());

-- POLICIES: PROFILES (RECREATION)
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

-- PHASE 7: INDEXES & PERFORMANCE
CREATE INDEX idx_vendors_slug ON public.vendors(slug);
CREATE INDEX idx_products_vendor ON public.products(vendor_id);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_variants_product ON public.product_variants(product_id);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_v_orders_order ON public.vendor_orders(order_id);
CREATE INDEX idx_v_orders_vendor ON public.vendor_orders(vendor_id);
CREATE INDEX idx_items_v_order ON public.order_items(vendor_order_id);

-- PHASE 8: STORAGE POLICIES (RECREATION)
-- Recreating storage policies that were dropped in Phase 1
-- Adjust bucket_id names if yours are different
CREATE POLICY "Vendors can upload product images" ON storage.objects
    FOR INSERT WITH CHECK (
        (SELECT role::text FROM public.profiles WHERE id = auth.uid()) = 'vendor'
    );

CREATE POLICY "Public can view images" ON storage.objects
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage all storage" ON storage.objects
    FOR ALL USING (public.is_admin());

-- PHASE 9: CORE TRIGGERS
-- Restore handle_new_user for Auth integration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'customer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
