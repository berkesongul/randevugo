-- ============================================================================
-- Migration 00002: Tenants Table
-- ============================================================================
-- Represents each business account (tenant) in the system. A tenant is a
-- single business that manages its own services, staff, and appointments.
-- The owner_id links to the profile that created/owns this business.
-- ============================================================================

CREATE TABLE public.tenants (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  slug       text        NOT NULL UNIQUE,
  owner_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  settings   jsonb       DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.tenants IS
  'Business accounts. Each tenant is an isolated business with its own data scope.';

COMMENT ON COLUMN public.tenants.slug IS
  'URL-safe unique identifier for the business (e.g., "acme-barber").';

COMMENT ON COLUMN public.tenants.settings IS
  'JSONB bag for business-specific settings: timezone, working hours, locale, etc.';

-- Index for fast slug lookups (public booking pages)
CREATE INDEX idx_tenants_slug ON public.tenants (slug);

-- Index for owner lookups
CREATE INDEX idx_tenants_owner_id ON public.tenants (owner_id);

-- Auto-update updated_at
CREATE TRIGGER set_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- POLICY: Owners can view their own tenant record.
-- Security logic: Only the user whose auth.uid() matches owner_id can read
-- the tenant row. This prevents businesses from seeing each other's settings.
CREATE POLICY "Owners can view own tenant"
  ON public.tenants
  FOR SELECT
  USING (auth.uid() = owner_id);

-- POLICY: Owners can update their own tenant record.
-- Security logic: Restricts tenant metadata changes (name, settings, etc.)
-- to the business owner only. Staff members cannot modify business settings.
CREATE POLICY "Owners can update own tenant"
  ON public.tenants
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- POLICY: Authenticated users can create a new tenant (become a business owner).
-- Security logic: Any authenticated user can create a tenant, but the owner_id
-- must match their own auth.uid() — you cannot create a tenant on behalf of
-- someone else.
CREATE POLICY "Authenticated users can create tenant"
  ON public.tenants
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);
