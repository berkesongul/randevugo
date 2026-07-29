// =============================================================================
// Supabase Browser Client
// =============================================================================
// For use in Client Components ('use client').
// Creates a Supabase client that runs in the browser and uses cookies
// managed by @supabase/ssr for session persistence.
// =============================================================================

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
