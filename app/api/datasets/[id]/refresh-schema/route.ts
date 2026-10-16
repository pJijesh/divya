import { NextResponse } from 'next/server';

import { getCurrentOrgMembership, roleSatisfies } from '@/lib/auth/current-org';
import { getConnector } from '@/lib/connectors/registry';
import { createClient } from '@/lib/supabase/server';

// Re-introspects a dataset's source and syncs dataset_fields: new columns
// are added, columns still present are left alone (preserves their id so
// existing metrics/dimensions keep working), and columns that disappeared
// are reported back (not deleted — see docs/UX.md §3.3 "schema drift":
// deleting them silently would break metrics/dimensions without warning).
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const membership = await getCurrentOrgMembership();

  if (!membership) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!roleSatisfies(membership.role, 'editor')) {
    return NextResponse.json(
      { error: 'Only editors and admins can refresh dataset schema' },
      { status: 403 },
    );
  }

  const { id: datasetId } = await params;
  const supabase = await createClient();

  const { data: dataset, error: datasetError } = await supabase
    .from('datasets')
    .select(
      'id, data_source_id, source_type, source_table_schema, source_table_name, source_sql, data_sources(id, type, host, port, database_name, username, ssl_mode)',
    )
    .eq('id', datasetId)
    .single();

  if (datasetError || !dataset) {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
  }

  const dataSource = dataset.data_sources;
  if (!dataSource) {
    return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
  }

  const { data: decryptedPassword, error: secretError } = await supabase.rpc(
    'get_data_source_secret',
    {
      data_source_row_id: dataSource.id,
    },
  );

  if (secretError || !decryptedPassword) {
    return NextResponse.json(
      { error: secretError?.message ?? 'Could not read credential' },
      { status: 500 },
    );
  }

  const connector = getConnector(dataSource.type);
  const connectionConfig = {
    host: dataSource.host,
    port: dataSource.port,
    database: dataSource.database_name,
    username: dataSource.username,
    decryptedPassword,
    sslMode: dataSource.ssl_mode as 'require' | 'disable' | 'verify-full',
  };

  let columns: { name: string; dataType: string; nullable: boolean }[];
  try {
    if (dataset.source_type === 'table') {
      const tables = await connector.listTables(connectionConfig);
      const table = tables.find(
        (t) => t.schema === dataset.source_table_schema && t.name === dataset.source_table_name,
      );
      if (!table) {
        return NextResponse.json({ error: 'Source table no longer exists' }, { status: 400 });
      }
      columns = table.columns;
    } else {
      columns = await connector.introspectQuery(connectionConfig, dataset.source_sql!);
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not refresh schema' },
      { status: 400 },
    );
  }

  const { data: existingFields } = await supabase
    .from('dataset_fields')
    .select('id, source_column')
    .eq('dataset_id', datasetId);

  const existingColumnNames = new Set((existingFields ?? []).map((f) => f.source_column));
  const newColumnNames = new Set(columns.map((c) => c.name));

  const removedColumns = [...existingColumnNames].filter((name) => !newColumnNames.has(name));
  const addedColumns = columns.filter((c) => !existingColumnNames.has(c.name));

  if (addedColumns.length > 0) {
    await supabase.from('dataset_fields').insert(
      addedColumns.map((column) => ({
        organization_id: membership.organizationId,
        dataset_id: datasetId,
        source_column: column.name,
        data_type: column.dataType,
      })),
    );
  }

  await supabase.from('datasets').update({ columns_cache: columns }).eq('id', datasetId);

  // Metrics/dimensions referencing a removed column — surfaced to the UI
  // as a warning (docs/UX.md §3.3), never auto-deleted.
  let affected: { metrics: string[]; dimensions: string[] } = { metrics: [], dimensions: [] };
  if (removedColumns.length > 0) {
    const { data: removedFields } = await supabase
      .from('dataset_fields')
      .select('id')
      .eq('dataset_id', datasetId)
      .in('source_column', removedColumns);

    const removedFieldIds = (removedFields ?? []).map((f) => f.id);

    if (removedFieldIds.length > 0) {
      const { data: affectedMetrics } = await supabase
        .from('metrics')
        .select('label, expression')
        .eq('dataset_id', datasetId);
      const { data: affectedDimensions } = await supabase
        .from('dimensions')
        .select('label, field_id')
        .eq('dataset_id', datasetId)
        .in('field_id', removedFieldIds);

      affected = {
        metrics: (affectedMetrics ?? [])
          .filter((m) =>
            removedFieldIds.includes((m.expression as { field_id?: string })?.field_id ?? ''),
          )
          .map((m) => m.label),
        dimensions: (affectedDimensions ?? []).map((d) => d.label),
      };
    }
  }

  return NextResponse.json({
    removedColumns,
    addedColumns: addedColumns.map((c) => c.name),
    affected,
  });
}
