-- ============================================================================
-- Migration 00003: Tenant Members & RLS Helper Function
-- ============================================================================
-- Bridge table that maps profiles to tenants with a role. This is the
-- FOUNDATION of all tenant-scoped RLS policies. The helper function
-- get_user_tenant_ids() is used by every subsequent table's policies.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tenant Members table
-- ---------------------------------------------------------------------------
CREATE TABLE public.tenant_members (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  profile_id uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       text        NOT NULL DEFAULT 'staff'
             CHECK (role IN ('owner', 'staff')),
  created_at timestamptz NOT NULL DEFAULT now(),

  -- A user can belong to a tenant only once
  UNIQUE (tenant_id, profile_id)
);

COMMENT ON TABLE public.tenant_members IS
  'Maps users to tenants with a role. Central table for RLS tenant-scoping.';

-- Indexes for fast lookups in RLS policies
CREATE INDEX idx_tenant_members_profile_id ON public.tenant_members (profile_id);
CREATE INDEX idx_tenant_members_tenant_id  ON public.tenant_members (tenant_id);

-- ---------------------------------------------------------------------------
-- 2. RLS helper function: get_user_tenant_ids()
-- ---------------------------------------------------------------------------
-- Returns all tenant_ids the currently authenticated user belongs to.
-- Used by RLS policies on services, staff, appointments, etc.
-- SECURITY DEFINER: runs with the function owner's privileges so it can
-- read tenant_members even when RLS is enabled on that table.
-- STABLE: result does not change within a single SQL statement.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS SETOF uuid AS $$
  SELECT tenant_id
  FROM public.tenant_members
  WHERE profile_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_user_tenant_ids() IS
  'Returns tenant IDs the current auth user belongs to. Used in all tenant-scoped RLS policies.';

-- ---------------------------------------------------------------------------
-- 3. Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- POLICY: Members can see other members of their tenant(s).
-- Security logic: You can view the membership list of any tenant you are
-- already a member of. This is needed so staff can see fellow team members.
CREATE POLICY "Members can view tenant memberships"
  ON public.tenant_members
  FOR SELECT
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- POLICY: Only tenant owners can add new members.
-- Security logic: Checks that the inserting user is an 'owner' in the target
-- tenant. Regular staff cannot invite or add other members.
CREATE POLICY "Owners can add tenant members"
  ON public.tenant_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_members AS tm
      WHERE tm.tenant_id  = tenant_id
        AND tm.profile_id = auth.uid()
        AND tm.role        = 'owner'
    )
  );

-- POLICY: Only tenant owners can remove members.
-- Security logic: Same ownership check as INSERT. Prevents staff from
-- removing other staff or the owner themselves.
CREATE POLICY "Owners can delete tenant members"
  ON public.tenant_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members AS tm
      WHERE tm.tenant_id  = tenant_id
        AND tm.profile_id = auth.uid()
        AND tm.role        = 'owner'
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Auto-add owner as tenant_member when a tenant is created
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_tenant()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.tenant_members (tenant_id, profile_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_tenant() IS
  'Trigger function: automatically adds the tenant owner to tenant_members on tenant creation.';

CREATE TRIGGER on_tenant_created
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_tenant();
