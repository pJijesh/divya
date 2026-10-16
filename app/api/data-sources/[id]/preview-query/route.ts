import { NextResponse } from 'next/server';

import { getCurrentOrgMembership, roleSatisfies } from '@/lib/auth/current-org';
import { getConnector } from '@/lib/connectors/registry';
import { createClient } from '@/lib/supabase/server';

// "Run & preview" for a query-type dataset — introspects the SQL's
// columns before the dataset is saved, per docs/UX.md §3.3: an editor
// should be able to catch a bad query without having already created a
// half-broken dataset. Never persists anything.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const membership = await getCurrentOrgMembership();

  if (!membership) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!roleSatisfies(membership.role, 'editor')) {
    return NextResponse.json(
      { error: 'Only editors and admins can preview queries' },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const sql = typeof body?.sql === 'string' ? body.sql.trim() : '';
  if (!sql) {
    return NextResponse.json({ error: 'A query is required' }, { status: 400 });
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: dataSource, error: dataSourceError } = await supabase
    .from('data_sources')
    .select('id, type, host, port, database_name, username, ssl_mode')
    .eq('id', id)
    .single();

  if (dataSourceError || !dataSource) {
    return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
  }

  const { data: decryptedPassword, error: secretError } = await supabase.rpc(
    'get_data_source_secret',
    {
      data_source_row_id: id,
    },
  );

  if (secretError || !decryptedPassword) {
    return NextResponse.json(
      { error: secretError?.message ?? 'Could not read credential' },
      { status: 500 },
    );
  }

  const connector = getConnector(dataSource.type);

  try {
    const columns = await connector.introspectQuery(
      {
        host: dataSource.host,
        port: dataSource.port,
        database: dataSource.database_name,
        username: dataSource.username,
        decryptedPassword,
        sslMode: dataSource.ssl_mode as 'require' | 'disable' | 'verify-full',
      },
      sql,
    );

    return NextResponse.json({ columns });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Query failed' },
      { status: 400 },
    );
  }
}
