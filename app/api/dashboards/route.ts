import { NextResponse } from 'next/server';

import { getCurrentOrgMembership, roleSatisfies } from '@/lib/auth/current-org';
import { createClient } from '@/lib/supabase/server';
import { dashboardCreateSchema } from '@/lib/validation/schemas';

export async function POST(request: Request) {
  const membership = await getCurrentOrgMembership();
  if (!membership) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!roleSatisfies(membership.role, 'editor')) {
    return NextResponse.json({ error: 'Only editors and admins can create dashboards' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = dashboardCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const supabase = await createClient();

  // Always starts as an unpublished draft — publishing is a deliberate,
  // separate action (docs/UX.md §3.4).
  const { data: dashboard, error } = await supabase
    .from('dashboards')
    .insert({
      organization_id: membership.organizationId,
      name: parsed.data.name,
      is_published: false,
      created_by: membership.userId,
    })
    .select('id')
    .single();

  if (error || !dashboard) {
    return NextResponse.json({ error: error?.message ?? 'Could not create dashboard' }, { status: 500 });
  }

  return NextResponse.json({ id: dashboard.id }, { status: 201 });
}
