-- ==============================================================================
-- Migration: 20260830000001_create_profiles_table.sql
-- Description: Additive user profile foundation for ADMIN and TENANT roles.
-- Safety: Non-destructive, preserves all existing tables and data intact.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- Linked to auth.users.id
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'TENANT')),
    tenant_id BIGINT NULL, -- Null for ADMIN, references tenants.id for TENANT
    email TEXT NULL,
    phone TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Foreign key relationship to existing tenants table (safe with ON DELETE SET NULL)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_profiles_tenant'
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT fk_profiles_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES public.tenants(id)
        ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint fk_profiles_tenant could not be created or already exists.';
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);

-- Enable Row Level Security (RLS) safely
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Safe and non-breaking)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Allow read profiles'
    ) THEN
        CREATE POLICY "Allow read profiles" ON public.profiles
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Allow update own profile'
    ) THEN
        CREATE POLICY "Allow update own profile" ON public.profiles
            FOR UPDATE USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Allow insert profile'
    ) THEN
        CREATE POLICY "Allow insert profile" ON public.profiles
            FOR INSERT WITH CHECK (true);
    END IF;
END $$;
