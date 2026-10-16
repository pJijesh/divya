import { NextResponse } from 'next/server';

import { getCurrentOrgMembership, roleSatisfies } from '@/lib/auth/current-org';
import { getConnector } from '@/lib/connectors/registry';
import { createClient } from '@/lib/supabase/server';
import { datasetCreateSchema } from '@/lib/validation/schemas';

export async function POST(request: Request) {
  const membership = await getCurrentOrgMembership();

  if (!membership) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!roleSatisfies(membership.role, 'editor')) {
    return NextResponse.json(
      { error: 'Only editors and admins can create datasets' },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = datasetCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data: dataSource, error: dataSourceError } = await supabase
    .from('data_sources')
    .select('id, type, host, port, database_name, username, ssl_mode')
    .eq('id', parsed.data.dataSourceId)
    .single();

  if (dataSourceError || !dataSource) {
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

  // Introspect BEFORE inserting the dataset row — a query-type dataset
  // with a bad query should fail here (docs/UX.md §3.3's "preview before
  // save" rule), not leave a half-broken dataset behind.
  let columns: { name: string; dataType: string; nullable: boolean }[];
  const input = parsed.data;
  try {
    if (input.sourceType === 'table') {
      const tables = await connector.listTables(connectionConfig);
      const table = tables.find(
        (t) => t.schema === input.sourceTableSchema && t.name === input.sourceTableName,
      );
      if (!table) {
        return NextResponse.json({ error: 'Table not found' }, { status: 404 });
      }
      columns = table.columns;
    } else {
      columns = await connector.introspectQuery(connectionConfig, input.sourceSql);
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not introspect the data' },
      { status: 400 },
    );
  }

  if (columns.length === 0) {
    return NextResponse.json({ error: 'No columns found' }, { status: 400 });
  }

  const { data: dataset, error: datasetError } = await supabase
    .from('datasets')
    .insert({
      organization_id: membership.organizationId,
      data_source_id: dataSource.id,
      name: input.name,
      description: input.description ?? null,
      source_type: input.sourceType,
      source_table_schema: input.sourceType === 'table' ? input.sourceTableSchema : null,
      source_table_name: input.sourceType === 'table' ? input.sourceTableName : null,
      source_sql: input.sourceType === 'query' ? input.sourceSql : null,
      columns_cache: columns,
      created_by: membership.userId,
    })
    .select('id')
    .single();

  if (datasetError || !dataset) {
    return NextResponse.json(
      { error: datasetError?.message ?? 'Could not create dataset' },
      { status: 500 },
    );
  }

  const { error: fieldsError } = await supabase.from('dataset_fields').insert(
    columns.map((column) => ({
      organization_id: membership.organizationId,
      dataset_id: dataset.id,
      source_column: column.name,
      data_type: column.dataType,
    })),
  );

  if (fieldsError) {
    return NextResponse.json({ error: fieldsError.message }, { status: 500 });
  }

  return NextResponse.json({ id: dataset.id }, { status: 201 });
}
