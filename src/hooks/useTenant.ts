'use client';

// =============================================================================
// useTenant Hook
// =============================================================================
// Convenience wrapper around TenantContext. Throws if used outside
// <TenantProvider /> to catch wiring bugs early.
// =============================================================================

import { useContext } from 'react';
import { TenantContext, type TenantContextValue } from '@/contexts/TenantProvider';

/**
 * Access the active tenant, membership, and tenant management functions.
 *
 * @example
 * ```tsx
 * const { tenant, membership, isLoading } = useTenant();
 *
 * if (isLoading) return <Spinner />;
 * return <h1>{tenant?.name}</h1>;
 * ```
 */
export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error(
      'useTenant() must be used within a <TenantProvider />. ' +
        'Wrap your component tree with <TenantProvider> in the root layout.'
    );
  }

  return context;
}
