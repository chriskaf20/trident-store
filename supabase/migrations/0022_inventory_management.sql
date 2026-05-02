-- ============================================================
-- Migration 0022: Inventory Management System
-- Adds stock reservation, decrement logic, and audit trails
-- ============================================================

-- 1. Add inventory constraints to products table
ALTER TABLE public.products
    ADD CONSTRAINT check_stock_not_negative CHECK (stock_quantity >= 0),
    ADD COLUMN IF NOT EXISTS reserved_quantity INT DEFAULT 0 CHECK (reserved_quantity >= 0);

-- 2. Create inventory_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('reserve', 'decrement', 'refund', 'adjustment', 'cancel_reservation')),
    quantity INT NOT NULL,
    quantity_before INT NOT NULL,
    quantity_after INT NOT NULL,
    reserved_before INT DEFAULT 0,
    reserved_after INT DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on inventory_logs
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- Everyone can view logs (read-only)
CREATE POLICY "Inventory logs are viewable by authenticated users" ON public.inventory_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON public.inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_order_id ON public.inventory_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON public.inventory_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_action ON public.inventory_logs(action);

-- 3. Create RPC function to safely reserve stock (transaction-safe)
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
    v_result JSONB;
BEGIN
    -- Lock the row for update (prevents concurrent issues)
    SELECT stock_quantity, reserved_quantity
    INTO v_current_stock, v_current_reserved
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Product not found',
            'code', 'PRODUCT_NOT_FOUND'
        );
    END IF;

    -- Calculate available stock (not reserved)
    v_available := v_current_stock - v_current_reserved;

    -- Check if enough stock available
    IF v_available < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Insufficient stock. Available: %s, Requested: %s', v_available, p_quantity),
            'code', 'INSUFFICIENT_STOCK',
            'available', v_available,
            'requested', p_quantity
        );
    END IF;

    -- Reserve the stock
    UPDATE public.products
    SET reserved_quantity = reserved_quantity + p_quantity
    WHERE id = p_product_id;

    -- Log the reservation
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

-- 4. Create RPC function to decrement stock (after order confirmed)
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
    v_result JSONB;
BEGIN
    -- Lock the row for update
    SELECT stock_quantity, reserved_quantity
    INTO v_current_stock, v_current_reserved
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Product not found',
            'code', 'PRODUCT_NOT_FOUND'
        );
    END IF;

    -- Check if enough stock
    IF v_current_stock < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Insufficient stock for decrement. Available: %s, Requested: %s', v_current_stock, p_quantity),
            'code', 'INSUFFICIENT_STOCK',
            'available', v_current_stock,
            'requested', p_quantity
        );
    END IF;

    -- Decrement stock and reserved quantity (assuming reserved stock is being decremented)
    UPDATE public.products
    SET 
        stock_quantity = stock_quantity - p_quantity,
        reserved_quantity = GREATEST(0, reserved_quantity - p_quantity)
    WHERE id = p_product_id;

    -- Log the decrement
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

-- 5. Create RPC function to cancel reservation (if order cancelled)
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
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Product not found'
        );
    END IF;

    -- Check if enough reserved stock to cancel
    IF v_current_reserved < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Cannot cancel %s units. Only %s reserved', p_quantity, v_current_reserved)
        );
    END IF;

    -- Cancel the reservation
    UPDATE public.products
    SET reserved_quantity = reserved_quantity - p_quantity
    WHERE id = p_product_id;

    -- Log the cancellation
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

-- 6. Create RPC to restore stock on return/refund
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
    -- Lock the row for update
    SELECT stock_quantity
    INTO v_current_stock
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Product not found'
        );
    END IF;

    -- Restore stock
    UPDATE public.products
    SET stock_quantity = stock_quantity + p_quantity
    WHERE id = p_product_id;

    -- Log the refund
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

-- 7. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.reserve_product_stock(UUID, INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(UUID, INT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_stock_reservation(UUID, INT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_product_stock(UUID, INT, UUID, TEXT) TO authenticated;

-- 8. Create low-stock alert view
CREATE OR REPLACE VIEW public.low_stock_products AS
SELECT
    p.id,
    p.name,
    p.store_id,
    s.owner_id,
    s.name as store_name,
    p.stock_quantity,
    p.reserved_quantity,
    (p.stock_quantity - p.reserved_quantity) as available_quantity
FROM public.products p
LEFT JOIN public.stores s ON p.store_id::uuid = s.id
WHERE (p.stock_quantity - p.reserved_quantity) < 5
    AND p.is_active = true;

COMMIT;
