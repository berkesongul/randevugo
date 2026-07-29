// =============================================================================
// Supabase Middleware Client
// =============================================================================
// Handles auth token refresh and role-based routing.
// - Owners → /dashboard (or /setup if no tenant)
// - Clients → /customer
// - Public routes are open to everyone.
// =============================================================================

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/types';
import { getSafeRedirectPath } from '@/lib/navigation';

/** Routes only accessible to business owners */
const OWNER_ROUTES = ['/dashboard', '/setup'];

/** Routes only accessible to clients */
const CLIENT_ROUTES = ['/customer'];

/** Auth routes where logged-in users shouldn't stay */
const AUTH_ROUTES = ['/login', '/signup'];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isOwnerRoute = OWNER_ROUTES.some((route) => pathname.startsWith(route));
  const isClientRoute = CLIENT_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // -------------------------------------------------------------------------
  // Rule 1: No user on protected routes → redirect to login
  // -------------------------------------------------------------------------
  if (!user && (isOwnerRoute || isClientRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // -------------------------------------------------------------------------
  // Rule 2: Logged-in user handling
  // -------------------------------------------------------------------------
  if (user) {
    // Fetch role (needed for owner routes, auth routes, and /explore guard)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'client';

    // --- Owner route access ---
    if (isOwnerRoute) {
      // Clients should never be on owner routes
      if (role === 'client') {
        const url = request.nextUrl.clone();
        url.pathname = '/customer';
        return NextResponse.redirect(url);
      }

      // Owner on /dashboard → check tenant membership
      if (pathname.startsWith('/dashboard')) {
        const { data: memberships } = await supabase
          .from('tenant_members')
          .select('id')
          .eq('profile_id', user.id)
          .limit(1);

        if (!memberships || memberships.length === 0) {
          const url = request.nextUrl.clone();
          url.pathname = '/setup';
          return NextResponse.redirect(url);
        }
      }

      // Owner on /setup → check if they already have a tenant
      if (pathname.startsWith('/setup')) {
        const { data: memberships } = await supabase
          .from('tenant_members')
          .select('id')
          .eq('profile_id', user.id)
          .limit(1);

        if (memberships && memberships.length > 0) {
          const url = request.nextUrl.clone();
          url.pathname = '/dashboard';
          return NextResponse.redirect(url);
        }
      }
    }

    // --- Client route access ---
    if (isClientRoute) {
      // Owners should never be on client routes
      if (role === 'owner') {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }

    // --- Auth routes: redirect logged-in users away ---
    if (isAuthRoute) {
      const redirectUrl = getSafeRedirectPath(
        request.nextUrl.searchParams.get('redirect')
      );
      if (redirectUrl) {
        const url = new URL(redirectUrl, request.url);
        return NextResponse.redirect(url);
      }

      // For owners, check tenant membership first
      if (role === 'owner') {
        const { data: memberships } = await supabase
          .from('tenant_members')
          .select('id')
          .eq('profile_id', user.id)
          .limit(1);

        const url = request.nextUrl.clone();
        if (!memberships || memberships.length === 0) {
          // Owner but no tenant yet → setup page
          url.pathname = '/setup';
        } else {
          // Owner with tenant → dashboard
          url.pathname = '/dashboard';
        }
        return NextResponse.redirect(url);
      } else {
        // Client → customer dashboard
        const url = request.nextUrl.clone();
        url.pathname = '/customer';
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
