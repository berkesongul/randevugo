-- Unified user accounts, business invitations and in-app notifications.
BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nickname text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS birth_date date;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_nickname_unique
  ON public.profiles (lower(nickname)) WHERE nickname IS NOT NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_nickname_format,
  ADD CONSTRAINT profiles_nickname_format
    CHECK (nickname IS NULL OR nickname ~ '^[a-z0-9_]{3,30}$');

ALTER TABLE public.tenant_members
  DROP CONSTRAINT IF EXISTS tenant_members_role_check,
  ADD CONSTRAINT tenant_members_role_check
    CHECK (role IN ('owner', 'manager', 'staff'));

CREATE TABLE IF NOT EXISTS public.tenant_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invited_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('manager', 'staff')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  UNIQUE (tenant_id, invited_profile_id, status)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_profile_created_idx ON public.notifications(profile_id, created_at DESC);

ALTER TABLE public.tenant_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recipients can view invitations" ON public.tenant_invitations
  FOR SELECT USING (invited_profile_id = auth.uid() OR invited_by = auth.uid());
CREATE POLICY "Owners and managers can invite" ON public.tenant_invitations
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_members tm WHERE tm.tenant_id = tenant_id AND tm.profile_id = auth.uid() AND tm.role IN ('owner', 'manager')));
CREATE POLICY "Recipients can respond to invitations" ON public.tenant_invitations
  FOR UPDATE USING (invited_profile_id = auth.uid()) WITH CHECK (invited_profile_id = auth.uid());
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Users can mark own notifications read" ON public.notifications FOR UPDATE USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

CREATE OR REPLACE FUNCTION public.invite_tenant_member(p_tenant_id uuid, p_nickname text, p_role text)
RETURNS uuid AS $$
DECLARE v_profile_id uuid; v_invitation_id uuid;
BEGIN
  IF p_role NOT IN ('manager', 'staff') THEN RAISE EXCEPTION 'Invalid invitation role'; END IF;
  SELECT id INTO v_profile_id FROM public.profiles WHERE lower(nickname) = lower(trim(p_nickname));
  IF v_profile_id IS NULL THEN RAISE EXCEPTION 'Nickname not found'; END IF;
  INSERT INTO public.tenant_invitations (tenant_id, invited_profile_id, invited_by, role)
  VALUES (p_tenant_id, v_profile_id, auth.uid(), p_role) RETURNING id INTO v_invitation_id;
  INSERT INTO public.notifications (profile_id, type, title, body, href)
  VALUES (v_profile_id, 'tenant_invitation', 'Yeni işletme daveti', 'Bir işletmede ' || p_role || ' olman için davet gönderildi.', '/requests');
  RETURN v_invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.respond_to_tenant_invitation(p_invitation_id uuid, p_accept boolean)
RETURNS void AS $$
DECLARE v_inv public.tenant_invitations;
BEGIN
  SELECT * INTO v_inv FROM public.tenant_invitations WHERE id = p_invitation_id AND invited_profile_id = auth.uid() AND status = 'pending' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation not found'; END IF;
  UPDATE public.tenant_invitations SET status = CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END, responded_at = now() WHERE id = p_invitation_id;
  IF p_accept THEN INSERT INTO public.tenant_members (tenant_id, profile_id, role) VALUES (v_inv.tenant_id, v_inv.invited_profile_id, v_inv.role) ON CONFLICT (tenant_id, profile_id) DO UPDATE SET role = EXCLUDED.role; END IF;
  INSERT INTO public.notifications (profile_id, type, title, body, href) VALUES (v_inv.invited_by, 'invitation_response', 'Davet yanıtlandı', CASE WHEN p_accept THEN 'Davet kabul edildi.' ELSE 'Davet reddedildi.' END, '/dashboard');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.invite_tenant_member(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.respond_to_tenant_invitation(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invite_tenant_member(uuid, text, text), public.respond_to_tenant_invitation(uuid, boolean) TO authenticated;
COMMIT;
