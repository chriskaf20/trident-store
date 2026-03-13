-- Performance Indexes Migration
-- Adds missing indexes for all high-frequency query patterns across the marketplace

-- ─── Products ───────────────────────────────────────────────────────────────
-- Vendor product listing: SELECT * FROM products WHERE store_id = $1
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);

-- Category browsing / filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- Trending page: SELECT * FROM products WHERE is_trending = true
CREATE INDEX IF NOT EXISTS idx_products_is_trending ON public.products(is_trending) WHERE is_trending = true;

-- ─── Orders ─────────────────────────────────────────────────────────────────
-- Customer order history: SELECT * FROM orders WHERE user_id = $1
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- Vendor order management: SELECT * FROM orders WHERE store_id = $1
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);

-- Admin / vendor order filtering by status
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- ─── Order Items ─────────────────────────────────────────────────────────────
-- Fetching items for an order
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- ─── Reviews ─────────────────────────────────────────────────────────────────
-- Product review listing: SELECT * FROM reviews WHERE product_id = $1
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);

-- ─── Wishlist ────────────────────────────────────────────────────────────────
-- User wishlist: SELECT * FROM wishlist WHERE user_id = $1
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);

-- ─── Vendor Applications ─────────────────────────────────────────────────────
-- Admin pending applications: SELECT * FROM vendor_applications WHERE status = 'pending'
CREATE INDEX IF NOT EXISTS idx_vendor_applications_status ON public.vendor_applications(status);

-- Admin: applications by user
CREATE INDEX IF NOT EXISTS idx_vendor_applications_user_id ON public.vendor_applications(user_id);

-- ─── Addresses ───────────────────────────────────────────────────────────────
-- User address lookup: SELECT * FROM addresses WHERE user_id = $1
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
