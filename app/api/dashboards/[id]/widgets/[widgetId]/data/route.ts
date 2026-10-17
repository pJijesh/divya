import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { executeWidgetQuery } from '@/lib/widgets/execute-widget-query';

// Ties RBAC + RLS + connector + compiler together for a persisted widget
// — the one request path both the designer and the viewer hit to render
// a widget's data. RLS on dashboard_widgets (see the dashboards
// migration) already enforces that only published dashboards are
// readable by viewer-role users, so no separate check is needed here.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; widgetId: string }> },
) {
  const { id: dashboardId, widgetId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: widget, error: widgetError } = await supabase
    .from('dashboard_widgets')
    .select('dataset_id, query_config')
    .eq('id', widgetId)
    .eq('dashboard_id', dashboardId)
    .single();

  if (widgetError || !widget) {
    return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
  }

  const config = widget.query_config as { metricIds: string[]; dimensionIds: string[] };

  const result = await executeWidgetQuery({
    datasetId: widget.dataset_id,
    metricIds: config.metricIds,
    dimensionIds: config.dimensionIds,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result);
}
