'use client';

// =============================================================================
// TenantProvider — Multi-Tenant Context
// =============================================================================
// Provides the active tenant and membership info to the entire app.
// On mount, fetches the user's tenant memberships and selects the first
// (or previously-selected) tenant as active.
// =============================================================================

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Tenant, TenantMember } from '@/types/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Combined membership with tenant details */
export interface TenantMembership {
  membership: TenantMember;
  tenant: Tenant;
}

export interface TenantContextValue {
  /** Currently active tenant (null while loading or if user has no tenant) */
  tenant: Tenant | null;
  /** Current user's membership record for the active tenant */
  membership: TenantMember | null;
  /** All tenants the user belongs to */
  allTenants: TenantMembership[];
  /** Whether tenant data is still loading */
  isLoading: boolean;
  /** Error message if tenant fetch failed */
  error: string | null;
  /** Switch the active tenant (for multi-tenant users) */
  switchTenant: (tenantId: string) => void;
  /** Re-fetch tenant data (e.g., after creating a new tenant) */
  refresh: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const TenantContext = createContext<TenantContextValue | null>(null);

// ---------------------------------------------------------------------------
// Storage key for persisting active tenant selection
// ---------------------------------------------------------------------------
const ACTIVE_TENANT_KEY = 'randevigo_active_tenant_id';

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function TenantProvider({ children }: { children: ReactNode }) {
  const [allTenants, setAllTenants] = useState<TenantMembership[]>([]);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  // -------------------------------------------------------------------------
  // Fetch tenant memberships
  // -------------------------------------------------------------------------
  const fetchTenants = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAllTenants([]);
        setActiveTenantId(null);
        setIsLoading(false);
        return;
      }

      // Fetch memberships with joined tenant data
      const { data: memberships, error: fetchError } = await supabase
        .from('tenant_members')
        .select(`
          id,
          tenant_id,
          profile_id,
          role,
          created_at,
          tenants:tenant_id (
            id,
            name,
            slug,
            owner_id,
            settings,
            created_at,
            updated_at
          )
        `)
        .eq('profile_id', user.id);

      if (fetchError) {
        setError(fetchError.message);
        setIsLoading(false);
        return;
      }

      // Map into TenantMembership shape
      const mapped: TenantMembership[] = (memberships ?? [])
        .filter((m) => m.tenants)
        .map((m) => ({
          membership: {
            id: m.id,
            tenant_id: m.tenant_id,
            profile_id: m.profile_id,
            role: m.role,
            created_at: m.created_at,
          } as TenantMember,
          tenant: m.tenants as unknown as Tenant,
        }));

      setAllTenants(mapped);

      // Restore previously selected tenant, or default to the first one
      const savedId =
        typeof window !== 'undefined'
          ? localStorage.getItem(ACTIVE_TENANT_KEY)
          : null;

      const initial =
        mapped.find((m) => m.tenant.id === savedId) ?? mapped[0] ?? null;

      setActiveTenantId(initial?.tenant.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tenants');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // -------------------------------------------------------------------------
  // Initial fetch
  // -------------------------------------------------------------------------
  useEffect(() => {
    void Promise.resolve().then(fetchTenants);
  }, [fetchTenants]);

  // -------------------------------------------------------------------------
  // Switch tenant
  // -------------------------------------------------------------------------
  const switchTenant = useCallback(
    (tenantId: string) => {
      const exists = allTenants.some((m) => m.tenant.id === tenantId);
      if (!exists) {
        console.warn(`[TenantProvider] Tenant ${tenantId} not found in memberships.`);
        return;
      }
      setActiveTenantId(tenantId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(ACTIVE_TENANT_KEY, tenantId);
      }
    },
    [allTenants]
  );

  // -------------------------------------------------------------------------
  // Computed active values
  // -------------------------------------------------------------------------
  const active = allTenants.find((m) => m.tenant.id === activeTenantId) ?? null;

  const value: TenantContextValue = useMemo(
    () => ({
      tenant: active?.tenant ?? null,
      membership: active?.membership ?? null,
      allTenants,
      isLoading,
      error,
      switchTenant,
      refresh: fetchTenants,
    }),
    [active, allTenants, isLoading, error, switchTenant, fetchTenants]
  );

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}
