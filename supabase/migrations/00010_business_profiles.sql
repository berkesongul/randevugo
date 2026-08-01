-- Public business profile content managed by the business owner.
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS gallery_urls text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS image_url text;

-- PostgreSQL does not allow CREATE OR REPLACE to change OUT columns.
-- Drop only these public read RPCs, then recreate them with the added fields.
DROP FUNCTION IF EXISTS public.get_public_tenant(text);
DROP FUNCTION IF EXISTS public.get_public_tenants();
DROP FUNCTION IF EXISTS public.get_public_services(uuid);

CREATE FUNCTION public.get_public_tenant(p_slug text)
RETURNS TABLE (id uuid, name text, slug text, city text, address text, phone text, description text, category text, cover_image_url text, gallery_urls text[]) AS $$
  SELECT t.id, t.name, t.slug, t.city, t.address, t.phone, t.description, t.category, t.cover_image_url, t.gallery_urls
  FROM public.tenants t WHERE t.slug = p_slug LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_public_tenant(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_tenant(text) TO anon, authenticated;

CREATE FUNCTION public.get_public_tenants()
RETURNS TABLE (id uuid, name text, slug text, city text, address text, phone text, description text, category text, cover_image_url text, gallery_urls text[]) AS $$
  SELECT t.id, t.name, t.slug, t.city, t.address, t.phone, t.description, t.category, t.cover_image_url, t.gallery_urls
  FROM public.tenants t ORDER BY t.name;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_public_tenants() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_tenants() TO anon, authenticated;

CREATE FUNCTION public.get_public_services(p_tenant_id uuid)
RETURNS TABLE (id uuid, tenant_id uuid, name text, duration_minutes integer, price numeric, is_active boolean, image_url text, created_at timestamptz, updated_at timestamptz) AS $$
  SELECT s.id, s.tenant_id, s.name, s.duration_minutes, s.price, s.is_active, s.image_url, s.created_at, s.updated_at
  FROM public.services s WHERE s.tenant_id = p_tenant_id AND s.is_active = true ORDER BY s.name;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_public_services(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_services(uuid) TO anon, authenticated;
