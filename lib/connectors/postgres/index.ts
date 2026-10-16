import { withReadOnlyConnection } from '@/lib/connectors/postgres/client';
import {
  introspectQuery as introspectQueryColumns,
  listTables as listTablesImpl,
} from '@/lib/connectors/postgres/introspect';
import { SsrfGuardError } from '@/lib/connectors/ssrf-guard';
import type {
  Connector,
  QueryRequest,
  QueryResult,
  TestConnectionResult,
} from '@/lib/connectors/types';

function describeConnectionError(err: unknown): string {
  if (err instanceof SsrfGuardError) return err.message;

  if (err && typeof err === 'object') {
    const code = 'code' in err ? String((err as { code?: unknown }).code) : undefined;
    const message = 'message' in err ? String((err as { message?: unknown }).message) : '';

    // Auth failure: distinguish from network issues per docs/UX.md §3.2 —
    // the user's next action differs (check host/port vs check credentials).
    if (code === '28P01' || code === '28000') {
      return 'Check the username and password.';
    }
    if (code === 'ENOTFOUND' || code === 'ECONNREFUSED' || code === 'ETIMEDOUT') {
      return 'Check the host and port, and that this database accepts connections from the internet (Divya connects from AWS us-east-1).';
    }
    if (message) return message;
  }

  return 'Could not connect to the database.';
}

export const postgresConnector: Connector = {
  type: 'postgres',

  async testConnection(config) {
    try {
      const tables = await withReadOnlyConnection(config, (client) => listTablesImpl(client));
      const result: TestConnectionResult = { ok: true, tableCount: tables.length };
      return result;
    } catch (err) {
      return { ok: false, error: describeConnectionError(err) };
    }
  },

  async listTables(config) {
    return withReadOnlyConnection(config, (client) => listTablesImpl(client));
  },

  async introspectQuery(config, sql) {
    return withReadOnlyConnection(config, (client) => introspectQueryColumns(client, sql));
  },

  async execute(config, request: QueryRequest) {
    return withReadOnlyConnection(
      config,
      async (client) => {
        const result = await client.query({
          text: request.sql,
          values: request.params,
          rowMode: 'array',
        });

        const rows = result.rows.slice(0, request.maxRows);

        const queryResult: QueryResult = {
          columns: result.fields.map((field) => ({
            name: field.name,
            dataType: String(field.dataTypeID),
          })),
          rows,
          truncated: result.rows.length > request.maxRows,
        };
        return queryResult;
      },
      request.timeoutMs,
    );
  },
};
