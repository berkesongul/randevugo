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
