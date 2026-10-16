import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/types/database.types';

// Browser client — respects RLS as the logged-in user. Safe to import into
// Client Components; uses the public anon/publishable key only.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
