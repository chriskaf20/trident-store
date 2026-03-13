-- ============================================================
-- 0014_unique_store_owner.sql
-- 1. Deduplicate stores: Keep only the oldest store for each owner.
-- 2. Adds a UNIQUE constraint to the owner_id column.
-- ============================================================

-- 1. Delete redundant stores, keeping the oldest one for each user
DELETE FROM public.stores
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY created_at ASC) as row_num
        FROM public.stores
    ) t
    WHERE t.row_num > 1
);

-- 2. Add the unique constraint
ALTER TABLE public.stores
ADD CONSTRAINT stores_owner_id_key UNIQUE (owner_id);
