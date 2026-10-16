import { NextResponse } from 'next/server';

import { getCurrentOrgMembership, roleSatisfies } from '@/lib/auth/current-org';
import { createClient } from '@/lib/supabase/server';
import { toSqlIdentifier } from '@/lib/utils/identifier';
import { dimensionCreateSchema } from '@/lib/validation/schemas';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const membership = await getCurrentOrgMembership();

  if (!membership) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!roleSatisfies(membership.role, 'editor')) {
    return NextResponse.json(
      { error: 'Only editors and admins can add dimensions' },
      { status: 403 },
    );
  }

  const { id: datasetId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = dimensionCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }
  if (parsed.data.type === 'time' && !parsed.data.timeGrain) {
    return NextResponse.json({ error: 'Time dimensions require a time grain' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: field, error: fieldError } = await supabase
    .from('dataset_fields')
    .select('id, dataset_id')
    .eq('id', parsed.data.fieldId)
    .eq('dataset_id', datasetId)
    .single();

  if (fieldError || !field) {
    return NextResponse.json({ error: 'Field not found on this dataset' }, { status: 404 });
  }

  const baseName = toSqlIdentifier(parsed.data.label);
  let name = baseName;

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: dimension, error: insertError } = await supabase
      .from('dimensions')
      .insert({
        organization_id: membership.organizationId,
        dataset_id: datasetId,
        name,
        label: parsed.data.label,
        field_id: field.id,
        type: parsed.data.type,
        time_grain: parsed.data.type === 'time' ? parsed.data.timeGrain : null,
      })
      .select('id, name, label, type, time_grain')
      .single();

    if (!insertError && dimension) {
      return NextResponse.json({ dimension }, { status: 201 });
    }

    if (insertError?.code === '23505') {
      name = `${baseName}_${Math.random().toString(36).slice(2, 6)}`;
      continue;
    }

    return NextResponse.json(
      { error: insertError?.message ?? 'Could not create dimension' },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { error: 'Could not allocate a unique dimension name' },
    { status: 500 },
  );
}
