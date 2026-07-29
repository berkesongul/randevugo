// =============================================================================
// Next.js Proxy
// =============================================================================
// Intercepts every matched request to:
//   1. Refresh the Supabase auth session (keep tokens alive)
//   2. Redirect unauthenticated users to /login
//   3. Redirect authenticated users without a tenant to /setup
// =============================================================================

import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (browser favicon)
     * - Public assets (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
