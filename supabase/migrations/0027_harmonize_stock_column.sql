-- Migration 0027: Harmonize stock column naming
-- Renames stock_quantity to stock if needed and updates all dependent RPC functions and views.

DO $$
BEGIN
    -- 1. Rename stock_quantity to stock if it exists and stock doesn't
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock_quantity') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock') THEN
        ALTER TABLE public.products RENAME COLUMN stock_quantity TO stock;
    
    -- 2. If both exist, we might need to sync them, but for safety we'll just ensure stock has the constraints
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock_quantity') 
          AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock') THEN
        -- Sync stock from stock_quantity if stock is 0/null and stock_quantity has data
        UPDATE public.products SET stock = stock_quantity WHERE (stock IS NULL OR stock = 0) AND stock_quantity > 0;
        -- Optionally drop stock_quantity later, but let's keep it for now for safety
    END IF;

    -- 3. Ensure reserved_quantity exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'reserved_quantity') THEN
        ALTER TABLE public.products ADD COLUMN reserved_quantity INT DEFAULT 0 CHECK (reserved_quantity >= 0);
    END IF;
END $$;

-- 2. Ensure constraints on 'stock'
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS check_stock_not_negative;
ALTER TABLE public.products ADD CONSTRAINT check_stock_not_negative CHECK (stock >= 0);

-- 3. Ensure inventory_logs exists
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    quantity INT NOT NULL,
    quantity_before INT NOT NULL,
    quantity_after INT NOT NULL,
    reserved_before INT DEFAULT 0,
    reserved_after INT DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Update RPC functions to use 'stock' instead of 'stock_quantity'
-- We must drop them first because we are changing the return type from BOOLEAN to JSONB

DROP FUNCTION IF EXISTS public.reserve_product_stock(UUID, INT, TEXT);
DROP FUNCTION IF EXISTS public.decrement_product_stock(UUID, INT, UUID, TEXT);
DROP FUNCTION IF EXISTS public.cancel_stock_reservation(UUID, INT);
DROP FUNCTION IF EXISTS public.cancel_stock_reservation(UUID, INT, UUID);
DROP FUNCTION IF EXISTS public.refund_product_stock(UUID, INT, UUID, TEXT);

-- reserve_product_stock
CREATE OR REPLACE FUNCTION public.reserve_product_stock(
    p_product_id UUID,
    p_quantity INT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current_stock INT;
    v_current_reserved INT;
    v_available INT;
BEGIN
    -- Lock the row for update
    SELECT stock, reserved_quantity
    INTO v_current_stock, v_current_reserved
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Product not found', 'code', 'PRODUCT_NOT_FOUND');
    END IF;

    v_available := v_current_stock - v_current_reserved;

    IF v_available < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', format('Insufficient stock. Available: %s, Requested: %s', v_available, p_quantity),
            'code', 'INSUFFICIENT_STOCK',
            'available', v_available,
            'requested', p_quantity
        );
    END IF;

    UPDATE public.products
    SET reserved_quantity = reserved_quantity + p_quantity
    WHERE id = p_product_id;

    INSERT INTO public.inventory_logs (
        product_id, action, quantity, quantity_before, quantity_after,
        reserved_before, reserved_after, notes
    )
    VALUES (
        p_product_id, 'reserve', p_quantity, v_current_stock, v_current_stock,
        v_current_reserved, v_current_reserved + p_quantity, p_notes
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Stock reserved successfully',
        'product_id', p_product_id,
        'reserved_quantity', p_quantity,
        'remaining_available', v_available - p_quantity
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- decrement_product_stock
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
    p_product_id UUID,
    p_quantity INT,
    p_order_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current_stock INT;
    v_current_reserved INT;
BEGIN
    SELECT stock, reserved_quantity
    INTO v_current_stock, v_current_reserved
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Product not found', 'code', 'PRODUCT_NOT_FOUND');
    END IF;

    IF v_current_stock < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Insufficient stock for decrement. Available: %s, Requested: %s', v_current_stock, p_quantity),
            'code', 'INSUFFICIENT_STOCK',
            'available', v_current_stock,
            'requested', p_quantity
        );
    END IF;

    UPDATE public.products
    SET 
        stock = stock - p_quantity,
        reserved_quantity = GREATEST(0, reserved_quantity - p_quantity)
    WHERE id = p_product_id;

    INSERT INTO public.inventory_logs (
        product_id, order_id, action, quantity, quantity_before, quantity_after,
        reserved_before, reserved_after, notes
    )
    VALUES (
        p_product_id, p_order_id, 'decrement', p_quantity, v_current_stock, v_current_stock - p_quantity,
        v_current_reserved, GREATEST(0, v_current_reserved - p_quantity), p_notes
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Stock decremented successfully',
        'product_id', p_product_id,
        'decremented', p_quantity,
        'remaining_stock', v_current_stock - p_quantity,
        'order_id', p_order_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- cancel_stock_reservation
CREATE OR REPLACE FUNCTION public.cancel_stock_reservation(
    p_product_id UUID,
    p_quantity INT,
    p_order_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current_reserved INT;
BEGIN
    -- Lock the row for update
    SELECT reserved_quantity
    INTO v_current_reserved
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Product not found');
    END IF;

    IF v_current_reserved < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Cannot cancel %s units. Only %s reserved', p_quantity, v_current_reserved)
        );
    END IF;

    UPDATE public.products
    SET reserved_quantity = reserved_quantity - p_quantity
    WHERE id = p_product_id;

    INSERT INTO public.inventory_logs (
        product_id, order_id, action, quantity, quantity_before, quantity_after,
        reserved_before, reserved_after
    )
    VALUES (
        p_product_id, p_order_id, 'cancel_reservation', p_quantity, 0, 0,
        v_current_reserved, v_current_reserved - p_quantity
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Reservation cancelled',
        'product_id', p_product_id,
        'cancelled_quantity', p_quantity
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- refund_product_stock
CREATE OR REPLACE FUNCTION public.refund_product_stock(
    p_product_id UUID,
    p_quantity INT,
    p_order_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current_stock INT;
BEGIN
    SELECT stock
    INTO v_current_stock
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Product not found');
    END IF;

    UPDATE public.products
    SET stock = stock + p_quantity
    WHERE id = p_product_id;

    INSERT INTO public.inventory_logs (
        product_id, order_id, action, quantity, quantity_before, quantity_after, notes
    )
    VALUES (
        p_product_id, p_order_id, 'refund', p_quantity, v_current_stock, v_current_stock + p_quantity,
        p_notes
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Stock refunded successfully',
        'product_id', p_product_id,
        'refunded_quantity', p_quantity,
        'new_stock', v_current_stock + p_quantity
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update low_stock_products view
CREATE OR REPLACE VIEW public.low_stock_products AS
SELECT
    p.id,
    p.name,
    p.store_id,
    s.owner_id,
    s.name as store_name,
    p.stock,
    p.reserved_quantity,
    (p.stock - p.reserved_quantity) as available_quantity
FROM public.products p
LEFT JOIN public.stores s ON p.store_id = s.id
WHERE (p.stock - p.reserved_quantity) < 5
    AND s.is_active = true;
