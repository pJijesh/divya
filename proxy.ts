import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

// Reachable without a session. '/auth' covers the email-confirmation
// callback, which must never redirect-away even when already logged in
// (unlike /login, /signup) since re-confirming while signed in is valid.
// '/' is the public marketing landing page — matched exactly, never as a
// prefix, since every path starts with '/'.
const PUBLIC_EXACT_PATHS = ['/'];
const PUBLIC_PREFIX_PATHS = ['/login', '/signup', '/auth'];
// Signed-in visitors get bounced to /dashboards instead of seeing the
// marketing page or an auth form again.
const REDIRECT_IF_AUTHENTICATED_PATHS = ['/', '/login', '/signup'];

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not remove: refreshes the session cookie on every request so Server
  // Components always see a valid session without each one re-deriving it.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublicPath =
    PUBLIC_EXACT_PATHS.includes(pathname) ||
    PUBLIC_PREFIX_PATHS.some((path) => pathname.startsWith(path));
  // API routes own their auth response (e.g. /api/health must stay reachable
  // unauthenticated, and Route Handlers return 401 JSON, not a page redirect).
  const isApiRoute = pathname.startsWith('/api');

  if (!user && !isPublicPath && !isApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  const shouldRedirectAuthenticated = REDIRECT_IF_AUTHENTICATED_PATHS.includes(pathname);

  if (user && shouldRedirectAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboards';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
