import { NextResponse } from 'next/server';

import { getCurrentOrgMembership, roleSatisfies } from '@/lib/auth/current-org';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; metricId: string }> },
) {
  const membership = await getCurrentOrgMembership();

  if (!membership) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!roleSatisfies(membership.role, 'editor')) {
    return NextResponse.json(
      { error: 'Only editors and admins can delete metrics' },
      { status: 403 },
    );
  }

  const { id: datasetId, metricId } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('metrics')
    .delete()
    .eq('id', metricId)
    .eq('dataset_id', datasetId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
