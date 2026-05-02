-- Fix for inventory RPC permissions to prevent unauthorized access
-- This migration restricts stock management RPC functions to the service_role

-- 1. Replace the functions to explicitly use SECURITY DEFINER and restrict to postgres role
CREATE OR REPLACE FUNCTION reserve_product_stock(p_product_id UUID, p_quantity INTEGER, p_reason TEXT DEFAULT 'Checkout reservation')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF current_setting('request.jwt.claim.role', true) IN ('anon', 'authenticated') THEN
        RAISE EXCEPTION 'Unauthorized: only service_role can call this function directly';
    END IF;

    UPDATE products
    SET 
        stock_quantity = stock_quantity - p_quantity,
        updated_at = NOW()
    WHERE id = p_product_id AND stock_quantity >= p_quantity;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock for product %', p_product_id;
    END IF;

    -- Log reservation
    INSERT INTO inventory_logs (product_id, change_amount, reason)
    VALUES (p_product_id, -p_quantity, p_reason);
    
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_product_stock(p_product_id UUID, p_quantity INTEGER, p_order_id UUID, p_reason TEXT DEFAULT 'Order fulfilled')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF current_setting('request.jwt.claim.role', true) IN ('anon', 'authenticated') THEN
        RAISE EXCEPTION 'Unauthorized: only service_role can call this function directly';
    END IF;

    INSERT INTO inventory_logs (product_id, order_id, change_amount, reason)
    VALUES (p_product_id, p_order_id, 0, p_reason || ' (Stock previously reserved)');
    
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION cancel_stock_reservation(p_product_id UUID, p_quantity INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF current_setting('request.jwt.claim.role', true) IN ('anon', 'authenticated') THEN
        RAISE EXCEPTION 'Unauthorized: only service_role can call this function directly';
    END IF;

    UPDATE products
    SET 
        stock_quantity = stock_quantity + p_quantity,
        updated_at = NOW()
    WHERE id = p_product_id;
    
    -- Log cancellation
    INSERT INTO inventory_logs (product_id, change_amount, reason)
    VALUES (p_product_id, p_quantity, 'Reservation cancelled');
    
    RETURN TRUE;
END;
$$;

-- 2. Revoke existing permissions
REVOKE EXECUTE ON FUNCTION reserve_product_stock(UUID, INTEGER, TEXT) FROM public;
REVOKE EXECUTE ON FUNCTION reserve_product_stock(UUID, INTEGER, TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION reserve_product_stock(UUID, INTEGER, TEXT) FROM anon;

REVOKE EXECUTE ON FUNCTION decrement_product_stock(UUID, INTEGER, UUID, TEXT) FROM public;
REVOKE EXECUTE ON FUNCTION decrement_product_stock(UUID, INTEGER, UUID, TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION decrement_product_stock(UUID, INTEGER, UUID, TEXT) FROM anon;

REVOKE EXECUTE ON FUNCTION cancel_stock_reservation(UUID, INTEGER) FROM public;
REVOKE EXECUTE ON FUNCTION cancel_stock_reservation(UUID, INTEGER) FROM authenticated;
REVOKE EXECUTE ON FUNCTION cancel_stock_reservation(UUID, INTEGER) FROM anon;

-- 3. Grant EXECUTE ONLY to service_role (which backend uses)
GRANT EXECUTE ON FUNCTION reserve_product_stock(UUID, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION decrement_product_stock(UUID, INTEGER, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION cancel_stock_reservation(UUID, INTEGER) TO service_role;
