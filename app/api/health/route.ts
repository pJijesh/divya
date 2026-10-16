import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

// Post-deploy smoke check: confirms the deployed app can actually reach
// Supabase, not just that the Next.js process started.
export async function GET() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('organizations').select('id').limit(1);

    if (error) {
      return NextResponse.json({ status: 'error', detail: error.message }, { status: 503 });
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    return NextResponse.json(
      { status: 'error', detail: err instanceof Error ? err.message : 'unknown error' },
      { status: 503 },
    );
  }
}
