import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from './useTenant';
import type {
  Staff,
  Profile,
  StaffInsert,
  StaffUpdate,
  TenantMember,
} from '@/types/types';

// Extended type to include profile data
export type StaffWithProfile = Staff & { profiles: Pick<Profile, 'full_name' | 'email'> | null };
export type PotentialStaff = Pick<TenantMember, 'profile_id'> & {
  profiles: Pick<Profile, 'full_name' | 'email'>;
};

export function useStaff() {
  const { tenant } = useTenant();
  const [staffList, setStaffList] = useState<StaffWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchStaff = useCallback(async () => {
    if (!tenant) {
      setStaffList([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('staff')
        .select(`
          *,
          profiles:profile_id (full_name, email)
        `)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setStaffList(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch staff');
    } finally {
      setIsLoading(false);
    }
  }, [tenant, supabase]);

  useEffect(() => {
    void Promise.resolve().then(fetchStaff);
  }, [fetchStaff]);

  const addStaff = async (staff: Omit<StaffInsert, 'tenant_id'>) => {
    if (!tenant) throw new Error('No active tenant');
    
    // Check if the profile is already a staff member
    const existing = staffList.find(s => s.profile_id === staff.profile_id);
    if (existing) throw new Error('Bu kullanıcı zaten personel olarak ekli.');

    const { data, error } = await supabase
      .from('staff')
      .insert({ ...staff, tenant_id: tenant.id })
      .select(`
        *,
        profiles:profile_id (full_name, email)
      `)
      .single();

    if (error) throw error;
    setStaffList((prev) => [data, ...prev]);
    return data;
  };

  const updateStaff = async (id: string, updates: StaffUpdate) => {
    const { data, error } = await supabase
      .from('staff')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        profiles:profile_id (full_name, email)
      `)
      .single();

    if (error) throw error;
    setStaffList((prev) => prev.map((s) => (s.id === id ? data : s)));
    return data;
  };

  const deleteStaff = async (id: string) => {
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (error) throw error;
    setStaffList((prev) => prev.filter((s) => s.id !== id));
  };

  // Helper function to get potential staff (users in the tenant who aren't staff yet)
  const getPotentialStaff = async () => {
    if (!tenant) return [];
    
    const { data, error } = await supabase
      .from('tenant_members')
      .select(`
        profile_id,
        profiles:profile_id (full_name, email)
      `)
      .eq('tenant_id', tenant.id);
      
    if (error) throw error;
    
    // Filter out those who are already in staffList
    const currentStaffIds = new Set(staffList.map(s => s.profile_id));
    return (data || []).filter(
      (member): member is PotentialStaff =>
        Boolean(member.profiles) && !currentStaffIds.has(member.profile_id)
    );
  };

  return {
    staffList,
    isLoading,
    error,
    refresh: fetchStaff,
    addStaff,
    updateStaff,
    deleteStaff,
    getPotentialStaff
  };
}
