-- ============================================================
-- 0010_vendor_applications_add_applicant_info.sql
-- Adds applicant_name and applicant_email columns to
-- vendor_applications so the admin dashboard can display
-- applicant info without a FK join on profiles (which fails
-- silently when RLS blocks cross-user profile reads).
-- ============================================================

-- Add columns (safe to run multiple times - IF NOT EXISTS is not
-- supported for ADD COLUMN before PG 9.6, but we use DO block)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'vendor_applications'
          AND column_name = 'applicant_name'
    ) THEN
        ALTER TABLE public.vendor_applications
            ADD COLUMN applicant_name text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'vendor_applications'
          AND column_name = 'applicant_email'
    ) THEN
        ALTER TABLE public.vendor_applications
            ADD COLUMN applicant_email text;
    END IF;

    -- It appears the user's table might be missing updated_at as well,
    -- which causes the update_updated_at_column trigger to fail during backfill.
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'vendor_applications'
          AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.vendor_applications
            ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
    END IF;

    -- Add missing columns to stores table required by the approval action
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'stores'
          AND column_name = 'instagram'
    ) THEN
        ALTER TABLE public.stores
            ADD COLUMN instagram text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'stores'
          AND column_name = 'whatsapp'
    ) THEN
        ALTER TABLE public.stores
            ADD COLUMN whatsapp text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'stores'
          AND column_name = 'city'
    ) THEN
        ALTER TABLE public.stores
            ADD COLUMN city text;
    END IF;
END $$;

-- Backfill existing rows with profile data (if any)
UPDATE public.vendor_applications va
SET
    applicant_name  = split_part(p.email, '@', 1), -- Fallback since profiles doesn't store name
    applicant_email = p.email
FROM public.profiles p
WHERE va.user_id = p.id
  AND (va.applicant_name IS NULL OR va.applicant_email IS NULL);

-- Add RLS policy so Admins can create and manage stores (they create the store for the vendor on approval)
DROP POLICY IF EXISTS "Admins can manage all stores" ON public.stores;
CREATE POLICY "Admins can manage all stores" ON public.stores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
