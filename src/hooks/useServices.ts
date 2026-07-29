import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from './useTenant';
import type { Service, ServiceInsert, ServiceUpdate } from '@/types/types';

export function useServices() {
  const { tenant } = useTenant();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchServices = useCallback(async () => {
    if (!tenant) {
      setServices([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setServices(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch services');
    } finally {
      setIsLoading(false);
    }
  }, [tenant, supabase]);

  useEffect(() => {
    void Promise.resolve().then(fetchServices);
  }, [fetchServices]);

  const addService = async (service: Omit<ServiceInsert, 'tenant_id'>) => {
    if (!tenant) throw new Error('No active tenant');
    
    const { data, error } = await supabase
      .from('services')
      .insert({ ...service, tenant_id: tenant.id })
      .select()
      .single();

    if (error) throw error;
    setServices((prev) => [data, ...prev]);
    return data;
  };

  const updateService = async (id: string, updates: ServiceUpdate) => {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    setServices((prev) => prev.map((s) => (s.id === id ? data : s)));
    return data;
  };

  const deleteService = async (id: string) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  return {
    services,
    isLoading,
    error,
    refresh: fetchServices,
    addService,
    updateService,
    deleteService,
  };
}
