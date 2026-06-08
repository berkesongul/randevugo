-- ============================================================================
-- Migration 00001: Profiles Table
-- ============================================================================
-- Creates the profiles table that bridges Supabase Auth (auth.users) with
-- the application layer. Each authenticated user gets exactly one profile row.
-- A trigger auto-creates the profile when a user signs up via Supabase Auth.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Shared utility: auto-update updated_at on any table
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.handle_updated_at() IS
  'Shared trigger function: automatically sets updated_at = now() on every UPDATE.';

-- ---------------------------------------------------------------------------
-- 2. Profiles table
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text        NOT NULL UNIQUE,
  full_name  text,
  role       text        NOT NULL DEFAULT 'client'
             CHECK (role IN ('owner', 'staff', 'client')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS
  'Application-level user profile linked 1:1 to auth.users.';

-- Auto-update updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Auto-create profile on auth.users INSERT
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Trigger function: creates a profile row whenever a new user signs up via Supabase Auth.';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- POLICY: Users can read only their own profile.
-- Security logic: auth.uid() must match the profile id. This prevents any
-- user from browsing other users' personal data.
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- POLICY: Users can update only their own profile.
-- Security logic: Same identity check. Users cannot modify another user's
-- email, name, or role through the profiles table.
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
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
-- ============================================================================
-- Migration 00006: Appointments Table
-- ============================================================================
-- Core booking entity. Each appointment ties a client to a staff member
-- and service within a specific tenant, with a defined time range.
-- Includes check constraints for data integrity before RLS even kicks in.
-- ============================================================================

CREATE TABLE public.appointments (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  service_id   uuid        NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  staff_id     uuid        NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  client_name  text        NOT NULL,
  client_phone text,
  client_email text,
  start_time   timestamptz NOT NULL,
  end_time     timestamptz NOT NULL,
  status       text        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  -- Sanity check: appointment must end after it starts
  CHECK (end_time > start_time)
);

COMMENT ON TABLE public.appointments IS
  'Bookings linking a client to a staff + service within a tenant. Tenant-scoped via RLS.';

-- Indexes for common query patterns
CREATE INDEX idx_appointments_tenant_id  ON public.appointments (tenant_id);
CREATE INDEX idx_appointments_staff_id   ON public.appointments (staff_id);
CREATE INDEX idx_appointments_start_time ON public.appointments (start_time);

-- Composite index for double-booking checks: staff + time range within a tenant
CREATE INDEX idx_appointments_staff_time
  ON public.appointments (tenant_id, staff_id, start_time, end_time);

-- Auto-update updated_at
CREATE TRIGGER set_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- POLICY: Tenant members can view appointments in their tenant.
-- Security logic: Appointment data (client info, schedule) is only accessible
-- to users belonging to the same tenant. Complete cross-tenant isolation.
CREATE POLICY "Tenant members can view appointments"
  ON public.appointments
  FOR SELECT
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- POLICY: Tenant members can create appointments for their tenant.
-- Security logic: The new appointment's tenant_id must match a tenant the
-- user belongs to. Prevents booking into another business's calendar.
CREATE POLICY "Tenant members can create appointments"
  ON public.appointments
  FOR INSERT
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- POLICY: Tenant members can update appointments in their tenant.
-- Security logic: Both existing and updated rows must stay within the user's
-- tenant scope — prevents re-assigning appointments to other tenants.
CREATE POLICY "Tenant members can update appointments"
  ON public.appointments
  FOR UPDATE
  USING  (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- POLICY: Tenant members can delete appointments in their tenant.
-- Security logic: Only appointments within the user's tenant can be removed.
CREATE POLICY "Tenant members can delete appointments"
  ON public.appointments
  FOR DELETE
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
-- ============================================================================
-- Migration 00007: Booking Validation Functions
-- ============================================================================
-- Implements double-booking prevention logic:
--   1. check_double_booking()  — trigger function that fires BEFORE INSERT/UPDATE
--      on appointments to reject overlapping time slots for the same staff member.
--   2. book_appointment()      — convenience RPC function that validates inputs
--      and creates an appointment in a single call.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Double-booking prevention trigger
-- ---------------------------------------------------------------------------
-- Logic: For a given (tenant_id, staff_id) pair, no two non-cancelled
-- appointments may have overlapping [start_time, end_time) ranges.
--
-- Overlap condition (standard range overlap):
--   existing.start_time < NEW.end_time AND existing.end_time > NEW.start_time
--
-- We exclude:
--   - Cancelled appointments (they don't block time slots)
--   - The current row on UPDATE (so updating non-time fields doesn't conflict
--     with itself)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_double_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for overlapping appointments for the same staff in the same tenant
  IF EXISTS (
    SELECT 1
    FROM public.appointments a
    WHERE a.tenant_id  = NEW.tenant_id
      AND a.staff_id   = NEW.staff_id
      AND a.status     != 'cancelled'        -- cancelled slots are free
      AND a.id         != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)  -- exclude self on UPDATE
      AND a.start_time <  NEW.end_time       -- overlap condition
      AND a.end_time   >  NEW.start_time     -- overlap condition
  ) THEN
    RAISE EXCEPTION 'Double booking conflict: staff member already has an appointment during this time slot.'
      USING ERRCODE = 'unique_violation',
            HINT    = 'Choose a different time slot or a different staff member.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.check_double_booking() IS
  'Trigger function: prevents overlapping appointments for the same staff member within a tenant. Cancelled appointments are excluded from conflict checks.';

CREATE TRIGGER prevent_double_booking
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_double_booking();

-- ---------------------------------------------------------------------------
-- 2. Convenience function: book_appointment()
-- ---------------------------------------------------------------------------
-- An RPC-callable function that validates inputs and inserts an appointment.
-- Benefits:
--   - Single network round-trip from the client
--   - Server-side validation (service exists, staff exists, same tenant)
--   - Double-booking check fires automatically via the trigger above
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.book_appointment(
  p_tenant_id    uuid,
  p_service_id   uuid,
  p_staff_id     uuid,
  p_client_name  text,
  p_client_phone text DEFAULT NULL,
  p_client_email text DEFAULT NULL,
  p_start_time   timestamptz DEFAULT NULL,
  p_notes        text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_duration    integer;
  v_end_time    timestamptz;
  v_appt_id     uuid;
  v_service_tid uuid;
  v_staff_tid   uuid;
BEGIN
  -- -----------------------------------------------------------------------
  -- Validate: service exists and belongs to this tenant
  -- -----------------------------------------------------------------------
  SELECT tenant_id, duration_minutes
    INTO v_service_tid, v_duration
    FROM public.services
   WHERE id = p_service_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found or inactive.'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF v_service_tid != p_tenant_id THEN
    RAISE EXCEPTION 'Service does not belong to this tenant.'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- -----------------------------------------------------------------------
  -- Validate: staff exists and belongs to this tenant
  -- -----------------------------------------------------------------------
  SELECT tenant_id
    INTO v_staff_tid
    FROM public.staff
   WHERE id = p_staff_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Staff member not found or inactive.'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF v_staff_tid != p_tenant_id THEN
    RAISE EXCEPTION 'Staff member does not belong to this tenant.'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- -----------------------------------------------------------------------
  -- Calculate end_time from service duration
  -- -----------------------------------------------------------------------
  v_end_time := p_start_time + (v_duration || ' minutes')::interval;

  -- -----------------------------------------------------------------------
  -- Insert appointment (the trigger will enforce double-booking prevention)
  -- -----------------------------------------------------------------------
  INSERT INTO public.appointments (
    tenant_id, service_id, staff_id,
    client_name, client_phone, client_email,
    start_time, end_time, status, notes
  )
  VALUES (
    p_tenant_id, p_service_id, p_staff_id,
    p_client_name, p_client_phone, p_client_email,
    p_start_time, v_end_time, 'pending', p_notes
  )
  RETURNING id INTO v_appt_id;

  RETURN v_appt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.book_appointment IS
  'Creates an appointment after validating service/staff ownership and calculating end_time from service duration. Double-booking prevention is enforced by the check_double_booking trigger.';
