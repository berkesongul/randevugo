import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from './useTenant';
import type { Appointment, AppointmentUpdate, Service, Staff, Profile } from '@/types/types';

export type AppointmentWithDetails = Appointment & {
  services: Pick<Service, 'name' | 'duration_minutes' | 'price'> | null;
  staff: (Pick<Staff, 'id'> & { profiles: Pick<Profile, 'full_name'> | null }) | null;
};

export function useAppointments() {
  const { tenant } = useTenant();
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchAppointments = useCallback(async () => {
    if (!tenant) {
      setAppointments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('appointments')
        .select(`
          *,
          services:service_id (name, duration_minutes, price),
          staff:staff_id (
            id,
            profiles:profile_id (full_name)
          )
        `)
        .eq('tenant_id', tenant.id)
        .order('start_time', { ascending: true });

      if (fetchError) throw fetchError;
      setAppointments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Randevular yüklenirken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [tenant, supabase]);

  useEffect(() => {
    void Promise.resolve().then(fetchAppointments);
  }, [fetchAppointments]);

  const addAppointment = async (
    params: {
      service_id: string;
      staff_id: string;
      client_name: string;
      client_phone?: string;
      client_email?: string;
      start_time: string;
      notes?: string;
    }
  ) => {
    if (!tenant) throw new Error('Aktif işletme bulunamadı');

    const { data: newId, error } = await supabase.rpc('book_appointment', {
      p_tenant_id: tenant.id,
      p_service_id: params.service_id,
      p_staff_id: params.staff_id,
      p_client_name: params.client_name,
      p_client_phone: params.client_phone || undefined,
      p_client_email: params.client_email || undefined,
      p_start_time: params.start_time,
      p_notes: params.notes || undefined,
    });

    if (error) {
      // Supabase RPC errors usually have .message, let's parse it
      throw new Error(error.message || 'Randevu oluşturulamadı');
    }

    // Refresh appointments to get the new one with all details
    await fetchAppointments();
    return newId;
  };

  const updateAppointment = async (id: string, updates: AppointmentUpdate) => {
    const { error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    await fetchAppointments();
  };

  const deleteAppointment = async (id: string) => {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) throw error;
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  return {
    appointments,
    isLoading,
    error,
    refresh: fetchAppointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
  };
}
