-- ============================================================================
-- Migration 00004: Services Table
-- ============================================================================
-- Services offered by a tenant (e.g., "Men's Haircut — 30 min — $25").
-- Fully tenant-scoped: each service belongs to exactly one tenant and is
-- invisible to members of other tenants.
-- ============================================================================

CREATE TABLE public.services (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid          NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name             text          NOT NULL,
  duration_minutes integer       NOT NULL CHECK (duration_minutes > 0),
  price            numeric(10,2),
  is_active        boolean       NOT NULL DEFAULT true,
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.services IS
  'Bookable services offered by a tenant. Tenant-scoped via RLS.';

-- Index for tenant-scoped queries (most common access pattern)
CREATE INDEX idx_services_tenant_id ON public.services (tenant_id);

-- Auto-update updated_at
CREATE TRIGGER set_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- POLICY: Tenant members can view their tenant's services.
-- Security logic: tenant_id must be in the set of tenants the current user
-- belongs to. A user in Tenant A cannot see services from Tenant B.
CREATE POLICY "Tenant members can view services"
  ON public.services
  FOR SELECT
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- POLICY: Tenant members can create services for their tenant.
-- Security logic: The inserted row's tenant_id must match one of the user's
-- tenants, preventing cross-tenant data injection.
CREATE POLICY "Tenant members can create services"
  ON public.services
  FOR INSERT
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- POLICY: Tenant members can update their tenant's services.
-- Security logic: Both the existing row and the updated row must belong to
-- a tenant the user is a member of — prevents moving data between tenants.
CREATE POLICY "Tenant members can update services"
  ON public.services
  FOR UPDATE
  USING  (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- POLICY: Tenant members can delete their tenant's services.
-- Security logic: Only services within the user's tenant can be removed.
CREATE POLICY "Tenant members can delete services"
  ON public.services
  FOR DELETE
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
