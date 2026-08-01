import { notFound } from 'next/navigation';
import PublicHeader from '@/components/PublicHeader/PublicHeader';
import { createClient } from '@/lib/supabase/server';
import BookingClient from '../BookingClient';

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: rows } = await supabase.rpc('get_public_tenant', { p_slug: slug });
  const tenant = rows?.[0];
  if (!tenant) notFound();
  const [{ data: services }, { data: staffList }] = await Promise.all([
    supabase.rpc('get_public_services', { p_tenant_id: tenant.id }),
    supabase.rpc('get_public_staff', { p_tenant_id: tenant.id }),
  ]);
  return <><PublicHeader /><BookingClient tenant={tenant} services={services || []} staffList={staffList || []} /></>;
}
