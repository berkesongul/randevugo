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
