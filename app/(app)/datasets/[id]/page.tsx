import { notFound, redirect } from 'next/navigation';

import { AppHeader } from '@/components/AppHeader';
import { DatasetDetailClient } from '@/components/datasets/DatasetDetailClient';
import { getCurrentOrgName } from '@/lib/auth/current-org';
import { createClient } from '@/lib/supabase/server';

export const instant = false;

export default async function DatasetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: dataset } = await supabase
    .from('datasets')
    .select(
      'id, name, description, source_type, source_table_schema, source_table_name, source_sql, data_sources(name)',
    )
    .eq('id', id)
    .single();

  if (!dataset) {
    notFound();
  }

  const { data: fields } = await supabase
    .from('dataset_fields')
    .select('id, source_column, data_type')
    .eq('dataset_id', id)
    .order('source_column');

  const { data: metrics } = await supabase
    .from('metrics')
    .select('id, name, label, aggregation, format')
    .eq('dataset_id', id)
    .order('created_at');

  const { data: dimensions } = await supabase
    .from('dimensions')
    .select('id, name, label, type, time_grain, field_id')
    .eq('dataset_id', id)
    .order('created_at');

  const orgName = await getCurrentOrgName();

  return (
    <>
      <AppHeader orgName={orgName ?? ''} />
      <DatasetDetailClient
        dataset={dataset}
        fields={fields ?? []}
        initialMetrics={metrics ?? []}
        initialDimensions={dimensions ?? []}
      />
    </>
  );
}
