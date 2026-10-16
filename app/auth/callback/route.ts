import { type NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

// Handles the Supabase email-confirmation link (PKCE code exchange).
// Exchanges the code for a session, then provisions the organization
// before sending the user into the app — see app/api/auth/provision-org.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const redirectTo = request.nextUrl.clone();
  redirectTo.search = '';

  if (!code) {
    redirectTo.pathname = '/login';
    return NextResponse.redirect(redirectTo);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirectTo.pathname = '/login';
    redirectTo.searchParams.set('error', 'confirmation_failed');
    return NextResponse.redirect(redirectTo);
  }

  await fetch(new URL('/api/auth/provision-org', request.url), {
    method: 'POST',
    headers: { cookie: request.headers.get('cookie') ?? '' },
  });

  redirectTo.pathname = '/dashboards';
  return NextResponse.redirect(redirectTo);
}
