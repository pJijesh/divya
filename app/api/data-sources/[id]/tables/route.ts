import { NextResponse } from 'next/server';

import { getCurrentOrgMembership, roleSatisfies } from '@/lib/auth/current-org';
import { getConnector } from '@/lib/connectors/registry';
import { createClient } from '@/lib/supabase/server';

// Lists tables/columns on an already-saved data source — used by the
// dataset creation UI's "pick a table" step. Decrypts the credential
// server-side only; it's never returned to the client.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const membership = await getCurrentOrgMembership();

  if (!membership) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!roleSatisfies(membership.role, 'editor')) {
    return NextResponse.json(
      { error: 'Only editors and admins can browse data source tables' },
      { status: 403 },
    );
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
    const tables = await connector.listTables({
      host: dataSource.host,
      port: dataSource.port,
      database: dataSource.database_name,
      username: dataSource.username,
      decryptedPassword,
      sslMode: dataSource.ssl_mode as 'require' | 'disable' | 'verify-full',
    });

    return NextResponse.json({ tables });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not list tables' },
      { status: 502 },
    );
  }
}
