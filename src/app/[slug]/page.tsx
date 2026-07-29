import { notFound } from 'next/navigation';
import PublicHeader from '@/components/PublicHeader/PublicHeader';
import { createClient } from '@/lib/supabase/server';
import BookingClient from './BookingClient';

export const revalidate = 60; // optionally cache for 60 seconds

export default async function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {

  const supabase = await createClient();
  const { slug } = await params;

  // 1. Fetch the safe public tenant projection.
  const { data: tenantRows, error: tenantError } = await supabase.rpc(
    'get_public_tenant',
    { p_slug: slug }
  );
  const tenant = tenantRows?.[0];

  if (tenantError || !tenant) {
    notFound();
  }

  // 2. Fetch safe public service/staff projections in parallel.
  const [{ data: services }, { data: staffList }] = await Promise.all([
    supabase.rpc('get_public_services', { p_tenant_id: tenant.id }),
    supabase.rpc('get_public_staff', { p_tenant_id: tenant.id }),
  ]);

  return (
    <>
      <PublicHeader />
      <BookingClient
        tenant={tenant}
        services={services || []}
        staffList={staffList || []}
      />
    </>
  );
}
