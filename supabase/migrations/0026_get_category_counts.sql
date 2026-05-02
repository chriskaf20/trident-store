-- Create RPC to get product counts by category

CREATE OR REPLACE FUNCTION get_category_counts()
RETURNS TABLE (category TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT products.category::TEXT, COUNT(*) AS count
    FROM products
    WHERE products.category IS NOT NULL
    GROUP BY products.category;
END;
$$;
