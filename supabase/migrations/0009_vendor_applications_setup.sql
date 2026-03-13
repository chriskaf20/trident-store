-- ============================================================
-- 0009_vendor_applications_setup.sql
-- Ensures the vendor_applications table exists with proper
-- columns, RLS enabled, and all required policies.
-- Safe to run even if the table already exists (uses IF NOT EXISTS).
-- ============================================================

-- 1. Create the vendor_applications table if it doesn't already exist
CREATE TABLE IF NOT EXISTS public.vendor_applications (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    store_name  text NOT NULL,
    store_slug  text NOT NULL,
    description text,
    city        text,
    instagram   text,
    whatsapp    text,
    status      text NOT NULL DEFAULT 'pending',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS (idempotent)
ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;

-- 3. Drop old / conflicting policies
DROP POLICY IF EXISTS "Enable read access for all users"       ON public.vendor_applications;
DROP POLICY IF EXISTS "Users can view their own applications"  ON public.vendor_applications;
DROP POLICY IF EXISTS "Admins can view all applications"       ON public.vendor_applications;
DROP POLICY IF EXISTS "Users can submit their own application" ON public.vendor_applications;
DROP POLICY IF EXISTS "Admins can update application status"   ON public.vendor_applications;

-- 4. Create policies

-- Users can see their own application
CREATE POLICY "Users can view their own applications" ON public.vendor_applications
    FOR SELECT USING (auth.uid() = vendor_applications.user_id);

-- Admins can see ALL applications (this is the key policy for the admin dashboard)
CREATE POLICY "Admins can view all applications" ON public.vendor_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Users can insert their own application
CREATE POLICY "Users can submit their own application" ON public.vendor_applications
    FOR INSERT WITH CHECK (auth.uid() = vendor_applications.user_id);

-- Admins can update (approve / reject) any application
CREATE POLICY "Admins can update application status" ON public.vendor_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 5. Auto-update updated_at on every row change
DROP TRIGGER IF EXISTS set_vendor_applications_updated_at ON public.vendor_applications;
CREATE TRIGGER set_vendor_applications_updated_at
    BEFORE UPDATE ON public.vendor_applications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
