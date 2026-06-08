import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import BookingClient from './BookingClient';

export const revalidate = 60; // optionally cache for 60 seconds

export default async function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {

  const supabase = await createClient();
  const { slug } = await params;

  // 1. Fetch Tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single();

  // Log slug, error ve tenant verisi
  console.log('BookingPage slug:', slug);
  if (tenantError) {
    console.error('Supabase tenantError:', tenantError);
  }
  if (!tenant) {
    console.warn('Supabase tenant not found for slug:', slug);
  }

  if (tenantError || !tenant) {
    notFound();
  }

  // 2. Fetch Active Services for this Tenant
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('name');

  // 3. Fetch Active Staff for this Tenant
  const { data: rawStaff } = await supabase
    .from('staff')
    .select(`
      id,
      bio,
      profiles:profile_id (full_name)
    `)
    .eq('tenant_id', tenant.id)
    .eq('is_active', true);

  // Supabase returns profiles as an array from a join; flatten to single object
  const staffList = (rawStaff || []).map((s: any) => ({
    id: s.id,
    bio: s.bio,
    profiles: Array.isArray(s.profiles) ? s.profiles[0] || null : s.profiles,
  }));

  return (
    <BookingClient 
      tenant={tenant} 
      services={services || []} 
      staffList={staffList} 
    />
  );
}
