import { NextResponse } from 'next/server';

import { getCurrentOrgMembership, roleSatisfies } from '@/lib/auth/current-org';
import { getConnector } from '@/lib/connectors/registry';
import { createClient } from '@/lib/supabase/server';
import { dataSourceConnectionSchema } from '@/lib/validation/schemas';

export async function POST(request: Request) {
  const membership = await getCurrentOrgMembership();

  if (!membership) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!roleSatisfies(membership.role, 'editor')) {
    return NextResponse.json(
      { error: 'Only editors and admins can add data sources' },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = dataSourceConnectionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // Re-test server-side rather than trusting the client's earlier "Test
  // connection" click — this is the one write path where that matters.
  const connector = getConnector('postgres');
  const testResult = await connector.testConnection({
    host: parsed.data.host,
    port: parsed.data.port,
    database: parsed.data.databaseName,
    username: parsed.data.username,
    decryptedPassword: parsed.data.password,
    sslMode: parsed.data.sslMode,
  });

  // Password never touches our own table — only a Vault secret reference
  // does. See supabase/migrations/20261016000004_data_sources.sql.
  const { data: credentialRef, error: secretError } = await supabase.rpc(
    'create_data_source_secret',
    {
      secret_value: parsed.data.password,
      secret_name: `data_source:${membership.organizationId}:${parsed.data.name}`,
    },
  );

  if (secretError || !credentialRef) {
    return NextResponse.json(
      { error: secretError?.message ?? 'Could not store the credential' },
      { status: 500 },
    );
  }

  const { data: dataSource, error: insertError } = await supabase
    .from('data_sources')
    .insert({
      organization_id: membership.organizationId,
      name: parsed.data.name,
      type: 'postgres',
      host: parsed.data.host,
      port: parsed.data.port,
      database_name: parsed.data.databaseName,
      username: parsed.data.username,
      ssl_mode: parsed.data.sslMode,
      credential_ref: credentialRef,
      status: testResult.ok ? 'connected' : 'error',
      last_tested_at: new Date().toISOString(),
      last_test_error: testResult.ok ? null : testResult.error,
      created_by: membership.userId,
    })
    .select(
      'id, name, type, host, port, database_name, username, ssl_mode, status, last_tested_at, last_test_error, created_at',
    )
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ dataSource, testResult }, { status: 201 });
}
