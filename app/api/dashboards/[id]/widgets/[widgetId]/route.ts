import { NextResponse } from 'next/server';

import { getCurrentOrgMembership, roleSatisfies } from '@/lib/auth/current-org';
import { createClient } from '@/lib/supabase/server';
import { dashboardWidgetUpdateSchema } from '@/lib/validation/schemas';
import type { TablesUpdate } from '@/types/database.types';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; widgetId: string }> },
) {
  const membership = await getCurrentOrgMembership();
  if (!membership) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!roleSatisfies(membership.role, 'editor')) {
    return NextResponse.json({ error: 'Only editors and admins can edit widgets' }, { status: 403 });
  }

  const { id: dashboardId, widgetId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = dashboardWidgetUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const supabase = await createClient();
  const update: TablesUpdate<'dashboard_widgets'> = {};

  if (parsed.data.title !== undefined) update.title = parsed.data.title;
  if (parsed.data.layout !== undefined) update.layout = parsed.data.layout;
  if (parsed.data.metricIds !== undefined || parsed.data.dimensionIds !== undefined) {
    const { data: current } = await supabase
      .from('dashboard_widgets')
      .select('query_config')
      .eq('id', widgetId)
      .eq('dashboard_id', dashboardId)
      .single();

    const currentConfig = (current?.query_config as { metricIds: string[]; dimensionIds: string[] }) ?? {
      metricIds: [],
      dimensionIds: [],
    };

    update.query_config = {
      metricIds: parsed.data.metricIds ?? currentConfig.metricIds,
      dimensionIds: parsed.data.dimensionIds ?? currentConfig.dimensionIds,
    };
  }

  const { error } = await supabase
    .from('dashboard_widgets')
    .update(update)
    .eq('id', widgetId)
    .eq('dashboard_id', dashboardId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; widgetId: string }> },
) {
  const membership = await getCurrentOrgMembership();
  if (!membership) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!roleSatisfies(membership.role, 'editor')) {
    return NextResponse.json({ error: 'Only editors and admins can delete widgets' }, { status: 403 });
  }

  const { id: dashboardId, widgetId } = await params;
  const supabase = await createClient();
  const { error } = await supabase
    .from('dashboard_widgets')
    .delete()
    .eq('id', widgetId)
    .eq('dashboard_id', dashboardId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
