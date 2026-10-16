import { NextResponse } from 'next/server';

import { getCurrentOrgMembership, roleSatisfies } from '@/lib/auth/current-org';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const membership = await getCurrentOrgMembership();

  if (!membership) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!roleSatisfies(membership.role, 'editor')) {
    return NextResponse.json(
      { error: 'Only editors and admins can delete data sources' },
      { status: 403 },
    );
  }

  const { id } = await params;
  const supabase = await createClient();

  // RLS still enforces org scoping even though we already checked role
  // above — this delete can never touch another organization's row.
  const { error } = await supabase.from('data_sources').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
