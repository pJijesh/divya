import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from '@/types/database.types';

// Server client — respects RLS as the logged-in user. Use inside Server
// Components and Route Handlers. Session cookies are refreshed by
// middleware.ts on every request, so the setAll() write here only needs to
// succeed when called from a Route Handler; a Server Component call to it
// is a no-op by design (cookies can't be mutated during RSC rendering).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore; middleware
            // handles session refresh for the response instead.
          }
        },
      },
    },
  );
}
