-- Create a view that joins products with their store information
-- This eliminates N+1 queries when fetching products with store names

CREATE OR REPLACE VIEW public.products_with_stores AS
SELECT
    p.id,
    p.store_id,
    p.name,
    p.slug,
    p.description,
    p.price,
    p.original_price,
    p.category,
    p.stock,
    p.image,
    p.images,
    p.sizes,
    p.colors,
    p.tags,
    p.is_trending,
    COALESCE((
        SELECT AVG(rating::numeric) 
        FROM public.reviews 
        WHERE product_id = p.id::text
    ), 0) AS rating,
    p.created_at,
    s.name AS store_name,
    s.slug AS store_slug
FROM
    public.products p
LEFT JOIN
    public.stores s ON p.store_id::uuid = s.id;

-- Create an index on the store_id for better query performance
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
