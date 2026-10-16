import { NextResponse } from 'next/server';

import { getCurrentOrgMembership, roleSatisfies } from '@/lib/auth/current-org';
import { createClient } from '@/lib/supabase/server';
import { toSqlIdentifier } from '@/lib/utils/identifier';
import { metricCreateSchema } from '@/lib/validation/schemas';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const membership = await getCurrentOrgMembership();

  if (!membership) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!roleSatisfies(membership.role, 'editor')) {
    return NextResponse.json({ error: 'Only editors and admins can add metrics' }, { status: 403 });
  }

  const { id: datasetId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = metricCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data: field, error: fieldError } = await supabase
    .from('dataset_fields')
    .select('id, dataset_id, source_column')
    .eq('id', parsed.data.fieldId)
    .eq('dataset_id', datasetId)
    .single();

  if (fieldError || !field) {
    return NextResponse.json({ error: 'Field not found on this dataset' }, { status: 404 });
  }

  const baseName = toSqlIdentifier(parsed.data.label);
  let name = baseName;

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: metric, error: insertError } = await supabase
      .from('metrics')
      .insert({
        organization_id: membership.organizationId,
        dataset_id: datasetId,
        name,
        label: parsed.data.label,
        aggregation: parsed.data.aggregation,
        format: parsed.data.format,
        expression: {
          field_id: field.id,
          source_column: field.source_column,
          aggregation: parsed.data.aggregation,
        },
      })
      .select('id, name, label, aggregation, format')
      .single();

    if (!insertError && metric) {
      return NextResponse.json({ metric }, { status: 201 });
    }

    if (insertError?.code === '23505') {
      name = `${baseName}_${Math.random().toString(36).slice(2, 6)}`;
      continue;
    }

    return NextResponse.json(
      { error: insertError?.message ?? 'Could not create metric' },
      { status: 500 },
    );
  }

  return NextResponse.json({ error: 'Could not allocate a unique metric name' }, { status: 500 });
}
