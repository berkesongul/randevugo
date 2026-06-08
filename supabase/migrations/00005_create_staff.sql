-- ============================================================================
-- Migration 00005: Staff Table
-- ============================================================================
-- Staff members who provide services within a tenant. Each staff row links
-- a profile (person) to a tenant (business), with an optional bio.
-- Separate from tenant_members to hold staff-specific data (bio, schedule).
-- ============================================================================

CREATE TABLE public.staff (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  profile_id uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio        text,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- A profile can be staff at a given tenant only once
  UNIQUE (tenant_id, profile_id)
);

COMMENT ON TABLE public.staff IS
  'Service providers within a tenant. Linked to profiles for identity and to tenants for scoping.';

-- Indexes
CREATE INDEX idx_staff_tenant_id  ON public.staff (tenant_id);
CREATE INDEX idx_staff_profile_id ON public.staff (profile_id);

-- Auto-update updated_at
CREATE TRIGGER set_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- POLICY: Tenant members can view staff in their tenant.
-- Security logic: Staff records are only visible to users who share the
-- same tenant_id. Cross-tenant staff browsing is blocked.
CREATE POLICY "Tenant members can view staff"
  ON public.staff
  FOR SELECT
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- POLICY: Tenant members can add staff to their tenant.
-- Security logic: The new staff row's tenant_id must match a tenant the
-- current user belongs to.
CREATE POLICY "Tenant members can create staff"
  ON public.staff
  FOR INSERT
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- POLICY: Tenant members can update staff in their tenant.
-- Security logic: Prevents cross-tenant modification and ensures the
-- updated row still belongs to an authorized tenant.
CREATE POLICY "Tenant members can update staff"
  ON public.staff
  FOR UPDATE
  USING  (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- POLICY: Tenant members can remove staff from their tenant.
-- Security logic: Only staff rows within the user's tenant scope can be deleted.
CREATE POLICY "Tenant members can delete staff"
  ON public.staff
  FOR DELETE
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
