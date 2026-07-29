-- ============================================================================
-- Migration 00009: Complete customer booking, profiles, favorites and RLS
-- ============================================================================
-- This migration closes the gap between the current web UI and the database:
--   - customer contact fields
--   - authenticated appointment ownership
--   - favorites
--   - safe public booking data
--   - customer appointment history/cancellation RPCs
--   - hardened booking RPC and SECURITY DEFINER search paths
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Profile fields used by the customer UI
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS city  text;

-- Users may edit their public profile fields, but not elevate their own role.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone, city) ON public.profiles TO authenticated;

-- Persist the selected account type even when email confirmation means the
-- browser does not receive a session immediately after sign-up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role text;
BEGIN
  requested_role := NEW.raw_user_meta_data ->> 'role';

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    CASE
      WHEN requested_role = 'owner' THEN 'owner'
      ELSE 'client'
    END
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, pg_temp;

-- ---------------------------------------------------------------------------
-- 2. Link appointments to authenticated customers
-- ---------------------------------------------------------------------------
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS client_id uuid
  REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_client_id
  ON public.appointments (client_id);

DROP POLICY IF EXISTS "Clients can view own appointments"
  ON public.appointments;

CREATE POLICY "Clients can view own appointments"
  ON public.appointments
  FOR SELECT
  USING (client_id = auth.uid());

-- Appointment creation must go through book_appointment() so tenant validation,
-- ownership and concurrency controls cannot be bypassed with a direct insert.
DROP POLICY IF EXISTS "Tenant members can create appointments"
  ON public.appointments;

-- ---------------------------------------------------------------------------
-- 3. Favorites
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.favorites (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id  uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_profile_id
  ON public.favorites (profile_id);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
CREATE POLICY "Users can view own favorites"
  ON public.favorites
  FOR SELECT
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can add own favorites" ON public.favorites;
CREATE POLICY "Users can add own favorites"
  ON public.favorites
  FOR INSERT
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can remove own favorites" ON public.favorites;
CREATE POLICY "Users can remove own favorites"
  ON public.favorites
  FOR DELETE
  USING (profile_id = auth.uid());

GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Public catalog access
-- ---------------------------------------------------------------------------
-- Migration 00008 made the complete tenant row public so the explore page
-- could work. That also exposed owner_id and the private settings JSON. Restore
-- tenant-scoped table access and expose only a safe public projection via RPC.
DROP POLICY IF EXISTS "Anyone can view tenants" ON public.tenants;
DROP POLICY IF EXISTS "Public can view tenants" ON public.tenants;
DROP POLICY IF EXISTS "Owners can view own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Members can view own tenants" ON public.tenants;

CREATE POLICY "Members can view own tenants"
  ON public.tenants
  FOR SELECT
  USING (id IN (SELECT public.get_user_tenant_ids()));

CREATE OR REPLACE FUNCTION public.get_public_tenant(p_slug text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  city text,
  address text,
  phone text,
  description text,
  category text
) AS $$
  SELECT
    t.id,
    t.name,
    t.slug,
    t.city,
    t.address,
    t.phone,
    t.description,
    t.category
  FROM public.tenants AS t
  WHERE t.slug = p_slug
  LIMIT 1;
$$ LANGUAGE sql
   SECURITY DEFINER
   STABLE
   SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_public_tenant(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_tenant(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_tenants()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  city text,
  address text,
  phone text,
  description text,
  category text
) AS $$
  SELECT
    t.id,
    t.name,
    t.slug,
    t.city,
    t.address,
    t.phone,
    t.description,
    t.category
  FROM public.tenants AS t
  ORDER BY t.name;
$$ LANGUAGE sql
   SECURITY DEFINER
   STABLE
   SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_public_tenants() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_tenants() TO anon, authenticated;

-- Keep service/staff tables tenant-scoped. Their public pages use narrow RPC
-- projections, so internal columns and future schema changes stay private.
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
DROP POLICY IF EXISTS "Anyone can view active staff" ON public.staff;

CREATE OR REPLACE FUNCTION public.get_public_services(p_tenant_id uuid)
RETURNS TABLE (
  id uuid,
  tenant_id uuid,
  name text,
  duration_minutes integer,
  price numeric,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
  SELECT
    s.id,
    s.tenant_id,
    s.name,
    s.duration_minutes,
    s.price,
    s.is_active,
    s.created_at,
    s.updated_at
  FROM public.services AS s
  WHERE s.tenant_id = p_tenant_id
    AND s.is_active = true
  ORDER BY s.name;
$$ LANGUAGE sql
   SECURITY DEFINER
   STABLE
   SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_public_services(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_services(uuid) TO anon, authenticated;

-- Profiles contain private fields, so expose only the staff display name via
-- a narrowly-scoped function instead of opening profile SELECT access.
CREATE OR REPLACE FUNCTION public.get_public_staff(p_tenant_id uuid)
RETURNS TABLE (
  staff_id uuid,
  bio text,
  full_name text
) AS $$
  SELECT s.id, s.bio, p.full_name
  FROM public.staff AS s
  JOIN public.profiles AS p ON p.id = s.profile_id
  WHERE s.tenant_id = p_tenant_id
    AND s.is_active = true
  ORDER BY COALESCE(p.full_name, ''), s.created_at;
$$ LANGUAGE sql
   SECURITY DEFINER
   STABLE
   SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_public_staff(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_staff(uuid) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Hardened booking
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
  v_client_id   uuid;
  v_duration    integer;
  v_end_time    timestamptz;
  v_appt_id     uuid;
  v_service_tid uuid;
  v_staff_tid   uuid;
BEGIN
  v_client_id := auth.uid();

  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to create an appointment.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_start_time IS NULL OR p_start_time <= now() THEN
    RAISE EXCEPTION 'Appointment start time must be in the future.'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF char_length(trim(COALESCE(p_client_name, ''))) < 2
     OR char_length(trim(p_client_name)) > 120 THEN
    RAISE EXCEPTION 'Client name must be between 2 and 120 characters.'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF char_length(COALESCE(p_client_phone, '')) > 40
     OR char_length(COALESCE(p_client_email, '')) > 254
     OR char_length(COALESCE(p_notes, '')) > 2000 THEN
    RAISE EXCEPTION 'One or more appointment fields exceed their maximum length.'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  SELECT tenant_id, duration_minutes
    INTO v_service_tid, v_duration
    FROM public.services
   WHERE id = p_service_id
     AND is_active = true;

  IF NOT FOUND OR v_service_tid != p_tenant_id THEN
    RAISE EXCEPTION 'Service not found, inactive, or belongs to another business.'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  SELECT tenant_id
    INTO v_staff_tid
    FROM public.staff
   WHERE id = p_staff_id
     AND is_active = true;

  IF NOT FOUND OR v_staff_tid != p_tenant_id THEN
    RAISE EXCEPTION 'Staff member not found, inactive, or belongs to another business.'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  v_end_time := p_start_time + make_interval(mins => v_duration);

  -- Serialize bookings for the same staff member inside the transaction. This
  -- makes the existing overlap trigger safe for all inserts through this RPC.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_staff_id::text, 0));

  INSERT INTO public.appointments (
    tenant_id,
    service_id,
    staff_id,
    client_id,
    client_name,
    client_phone,
    client_email,
    start_time,
    end_time,
    status,
    notes
  )
  VALUES (
    p_tenant_id,
    p_service_id,
    p_staff_id,
    v_client_id,
    trim(p_client_name),
    NULLIF(trim(COALESCE(p_client_phone, '')), ''),
    NULLIF(trim(COALESCE(p_client_email, '')), ''),
    p_start_time,
    v_end_time,
    'pending',
    NULLIF(trim(COALESCE(p_notes, '')), '')
  )
  RETURNING id INTO v_appt_id;

  RETURN v_appt_id;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.book_appointment(
  uuid, uuid, uuid, text, text, text, timestamptz, text
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.book_appointment(
  uuid, uuid, uuid, text, text, text, timestamptz, text
) FROM anon;
GRANT EXECUTE ON FUNCTION public.book_appointment(
  uuid, uuid, uuid, text, text, text, timestamptz, text
) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. Customer appointment history and cancellation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_appointments()
RETURNS TABLE (
  id uuid,
  tenant_id uuid,
  tenant_name text,
  tenant_slug text,
  service_id uuid,
  service_name text,
  staff_id uuid,
  staff_name text,
  start_time timestamptz,
  end_time timestamptz,
  status text,
  notes text
) AS $$
  SELECT
    a.id,
    a.tenant_id,
    t.name,
    t.slug,
    a.service_id,
    sv.name,
    a.staff_id,
    p.full_name,
    a.start_time,
    a.end_time,
    a.status,
    a.notes
  FROM public.appointments AS a
  JOIN public.tenants AS t ON t.id = a.tenant_id
  JOIN public.services AS sv ON sv.id = a.service_id
  JOIN public.staff AS st ON st.id = a.staff_id
  JOIN public.profiles AS p ON p.id = st.profile_id
  WHERE a.client_id = auth.uid()
  ORDER BY a.start_time DESC;
$$ LANGUAGE sql
   SECURITY DEFINER
   STABLE
   SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_my_appointments() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_appointments() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_appointments() TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_my_appointment(p_appointment_id uuid)
RETURNS boolean AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.appointments
     SET status = 'cancelled'
   WHERE id = p_appointment_id
     AND client_id = auth.uid()
     AND status IN ('pending', 'confirmed');

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  IF updated_count = 0 THEN
    RAISE EXCEPTION 'Appointment cannot be cancelled or was not found.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.cancel_my_appointment(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_my_appointment(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.cancel_my_appointment(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_favorites()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  city text
) AS $$
  SELECT t.id, t.name, t.slug, t.city
  FROM public.favorites AS f
  JOIN public.tenants AS t ON t.id = f.tenant_id
  WHERE f.profile_id = auth.uid()
  ORDER BY f.created_at DESC;
$$ LANGUAGE sql
   SECURITY DEFINER
   STABLE
   SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_my_favorites() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_favorites() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_favorites() TO authenticated;

CREATE OR REPLACE FUNCTION public.set_favorite(
  p_tenant_id uuid,
  p_is_favorite boolean
)
RETURNS boolean AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  v_profile_id := auth.uid();

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to update favorites.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = p_tenant_id) THEN
    RAISE EXCEPTION 'Business not found.'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF p_is_favorite THEN
    INSERT INTO public.favorites (profile_id, tenant_id)
    VALUES (v_profile_id, p_tenant_id)
    ON CONFLICT (profile_id, tenant_id) DO NOTHING;
  ELSE
    DELETE FROM public.favorites
    WHERE profile_id = v_profile_id
      AND tenant_id = p_tenant_id;
  END IF;

  RETURN p_is_favorite;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.set_favorite(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_favorite(uuid, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_favorite(uuid, boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. Harden existing SECURITY DEFINER helper/trigger functions
-- ---------------------------------------------------------------------------
ALTER FUNCTION public.get_user_tenant_ids()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.handle_new_tenant()
  SET search_path = public, pg_temp;

COMMIT;
