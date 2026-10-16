import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database.types';

// Service-role client — bypasses RLS entirely. Use ONLY inside Route
// Handlers that must deliberately act outside the current user's
// permissions (e.g. atomically provisioning an organization + admin
// membership on signup). Never import this into a Client Component or a
// Server Component that renders to the browser; never log or return its
// results unfiltered to the client.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
