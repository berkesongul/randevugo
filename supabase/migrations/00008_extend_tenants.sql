-- ============================================================================
-- Migration 00008: Extend Tenants with Location, Category & Public Access
-- ============================================================================
-- Adds city, address, phone, description, and category fields to tenants.
-- Also adds a public SELECT policy so customers can browse businesses.
-- ============================================================================

-- 1. Add new columns
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS city        text,
  ADD COLUMN IF NOT EXISTS address     text,
  ADD COLUMN IF NOT EXISTS phone       text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS category    text DEFAULT 'other'
    CHECK (category IN (
      'barber',        -- Berber
      'beauty_salon',  -- Güzellik Salonu
      'clinic',        -- Klinik
      'spa',           -- Spa & Masaj
      'fitness',       -- Fitness & Spor
      'dental',        -- Diş Kliniği
      'veterinary',    -- Veteriner
      'consulting',    -- Danışmanlık
      'photography',   -- Fotoğrafçılık
      'education',     -- Eğitim & Kurs
      'other'          -- Diğer
    ));

COMMENT ON COLUMN public.tenants.city IS
  'City name for location-based filtering (e.g., "İstanbul", "Ankara").';

COMMENT ON COLUMN public.tenants.category IS
  'Business category for filtering on the explore page.';

-- 2. Index for city-based filtering
CREATE INDEX IF NOT EXISTS idx_tenants_city ON public.tenants (city);

-- 3. Index for category-based filtering
CREATE INDEX IF NOT EXISTS idx_tenants_category ON public.tenants (category);

-- 4. Public SELECT policy: allow anyone to browse businesses
-- Drop the restrictive owner-only policy first, then create a public one
DROP POLICY IF EXISTS "Owners can view own tenant" ON public.tenants;

CREATE POLICY "Anyone can view tenants"
  ON public.tenants
  FOR SELECT
  USING (true);
