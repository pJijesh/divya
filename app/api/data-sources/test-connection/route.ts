import { NextResponse } from 'next/server';

import { getConnector } from '@/lib/connectors/registry';
import { createClient } from '@/lib/supabase/server';
import { dataSourceConnectionSchema } from '@/lib/validation/schemas';

// Tests connection details that may not be saved yet (the "Test
// connection" button in the Add Data Source form). Still requires a
// session — without this, the endpoint would be an open network-probe
// oracle for arbitrary hosts, even though it never touches the database.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = dataSourceConnectionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const connector = getConnector('postgres');
  const result = await connector.testConnection({
    host: parsed.data.host,
    port: parsed.data.port,
    database: parsed.data.databaseName,
    username: parsed.data.username,
    decryptedPassword: parsed.data.password,
    sslMode: parsed.data.sslMode,
  });

  return NextResponse.json(result);
}
