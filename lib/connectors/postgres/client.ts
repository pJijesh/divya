import { Client } from 'pg';

import { assertHostIsAllowed } from '@/lib/connectors/ssrf-guard';
import type { ConnectionConfig } from '@/lib/connectors/types';

const DEFAULT_STATEMENT_TIMEOUT_MS = 15_000;

function buildSsl(sslMode: ConnectionConfig['sslMode']) {
  if (sslMode === 'disable') return false;
  // 'require' and 'verify-full' both negotiate TLS; without a CA bundle
  // for the user's specific provider we can't do full chain verification
  // for 'require', so it's "encrypted, not strictly verified" — matching
  // common managed-Postgres defaults (e.g. a self-signed proxy cert).
  // 'verify-full' is reserved for a later phase once per-source CA certs
  // can be configured.
  return { rejectUnauthorized: sslMode === 'verify-full' };
}

/**
 * Opens a single connection, runs `fn` inside a READ ONLY transaction with
 * a statement timeout, then always closes the connection — regardless of
 * whether `fn` throws. This is the only way connector code is allowed to
 * reach an external Postgres database: every query, including
 * introspection, goes through this wrapper so the read-only guarantee and
 * SSRF check can never accidentally be skipped by a new call site.
 */
export async function withReadOnlyConnection<T>(
  config: ConnectionConfig,
  fn: (client: Client) => Promise<T>,
  timeoutMs: number = DEFAULT_STATEMENT_TIMEOUT_MS,
): Promise<T> {
  await assertHostIsAllowed(config.host);

  const client = new Client({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.decryptedPassword,
    ssl: buildSsl(config.sslMode),
    connectionTimeoutMillis: 10_000,
    query_timeout: timeoutMs,
  });

  await client.connect();

  try {
    await client.query(`set statement_timeout = ${Math.floor(timeoutMs)}`);
    await client.query('begin transaction read only');
    try {
      const result = await fn(client);
      await client.query('commit');
      return result;
    } catch (err) {
      await client.query('rollback').catch(() => undefined);
      throw err;
    }
  } finally {
    await client.end().catch(() => undefined);
  }
}
