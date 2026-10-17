import { NextResponse } from 'next/server';

import { getCurrentOrgMembership, roleSatisfies } from '@/lib/auth/current-org';
import { createClient } from '@/lib/supabase/server';
import { dashboardWidgetCreateSchema } from '@/lib/validation/schemas';

const DEFAULT_LAYOUT_BY_TYPE: Record<string, { w: number; h: number }> = {
  kpi: { w: 3, h: 2 },
  table: { w: 8, h: 4 },
  pivot_table: { w: 8, h: 4 },
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const membership = await getCurrentOrgMembership();
  if (!membership) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!roleSatisfies(membership.role, 'editor')) {
    return NextResponse.json({ error: 'Only editors and admins can add widgets' }, { status: 403 });
  }

  const { id: dashboardId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = dashboardWidgetCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // New widgets are placed at the bottom of whatever's already there, per
  // docs/UX.md §3.4 — the user shouldn't have to manually position a
  // brand-new widget before it's usable.
  const { data: existingWidgets } = await supabase
    .from('dashboard_widgets')
    .select('layout')
    .eq('dashboard_id', dashboardId);

  const maxY = (existingWidgets ?? []).reduce((max, w) => {
    const layout = w.layout as { y: number; h: number };
    return Math.max(max, (layout?.y ?? 0) + (layout?.h ?? 0));
  }, 0);

  const defaultSize = DEFAULT_LAYOUT_BY_TYPE[parsed.data.widgetType] ?? { w: 6, h: 4 };
  const layout = parsed.data.layout ?? { x: 0, y: maxY, ...defaultSize };

  const { data: widget, error } = await supabase
    .from('dashboard_widgets')
    .insert({
      organization_id: membership.organizationId,
      dashboard_id: dashboardId,
      dataset_id: parsed.data.datasetId,
      widget_type: parsed.data.widgetType,
      title: parsed.data.title ?? null,
      query_config: { metricIds: parsed.data.metricIds, dimensionIds: parsed.data.dimensionIds },
      layout,
    })
    .select('id, widget_type, title, dataset_id, query_config, layout')
    .single();

  if (error || !widget) {
    return NextResponse.json({ error: error?.message ?? 'Could not add widget' }, { status: 500 });
  }

  return NextResponse.json({ widget }, { status: 201 });
}
