import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentOrgMembership } from '@/lib/auth/current-org';
import { executeWidgetQuery } from '@/lib/widgets/execute-widget-query';

const previewRequestSchema = z.object({
  datasetId: z.uuid(),
  metricIds: z.array(z.uuid()).min(1, 'At least one metric is required'),
  dimensionIds: z.array(z.uuid()).default([]),
});

// Executes a widget's {dataset, metrics, dimensions} against the real
// connector — used by the standalone widget preview page. Not tied to a
// persisted dashboard_widgets row, so widget configs can be tested before
// a dashboard exists at all. See lib/widgets/execute-widget-query.ts for
// the shared logic also used by the dashboard designer/viewer's widget
// data-fetch route.
export async function POST(request: Request) {
  const membership = await getCurrentOrgMembership();
  if (!membership) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = previewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const result = await executeWidgetQuery(parsed.data);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result);
}
