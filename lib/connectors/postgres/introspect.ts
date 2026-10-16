import type { Client } from 'pg';

import type { FieldDataType, IntrospectedColumn, IntrospectedTable } from '@/lib/connectors/types';

const SYSTEM_SCHEMAS = ['pg_catalog', 'information_schema', 'pg_toast'];

// information_schema.columns.data_type is a readable text label.
function mapInformationSchemaType(dataType: string): FieldDataType {
  const normalized = dataType.toLowerCase();
  if (normalized.includes('timestamp') || normalized === 'date' || normalized.includes('time')) {
    return 'date';
  }
  if (
    normalized.includes('int') ||
    normalized.includes('numeric') ||
    normalized.includes('decimal') ||
    normalized.includes('real') ||
    normalized.includes('double')
  ) {
    return 'number';
  }
  if (normalized === 'boolean') return 'boolean';
  if (normalized === 'json' || normalized === 'jsonb') return 'json';
  return 'string';
}

// Ad-hoc query results only expose a numeric Postgres type OID (no
// information_schema to join against), so introspectQuery maps the
// stable built-in OIDs directly instead.
const OID_TYPE_MAP: Record<number, FieldDataType> = {
  16: 'boolean',
  20: 'number', // int8
  21: 'number', // int2
  23: 'number', // int4
  700: 'number', // float4
  701: 'number', // float8
  1700: 'number', // numeric
  1082: 'date', // date
  1083: 'date', // time
  1114: 'date', // timestamp
  1184: 'date', // timestamptz
  1266: 'date', // timetz
  114: 'json',
  3802: 'json', // jsonb
};

function mapOidType(oid: number): FieldDataType {
  return OID_TYPE_MAP[oid] ?? 'string';
}

export async function listTables(client: Client): Promise<IntrospectedTable[]> {
  const result = await client.query<{
    table_schema: string;
    table_name: string;
    column_name: string;
    data_type: string;
    is_nullable: 'YES' | 'NO';
  }>(
    `select c.table_schema, c.table_name, c.column_name, c.data_type, c.is_nullable
     from information_schema.columns c
     join information_schema.tables t
       on t.table_schema = c.table_schema and t.table_name = c.table_name
     where t.table_type = 'BASE TABLE'
       and c.table_schema != all($1::text[])
     order by c.table_schema, c.table_name, c.ordinal_position`,
    [SYSTEM_SCHEMAS],
  );

  const tablesByKey = new Map<string, IntrospectedTable>();

  for (const row of result.rows) {
    const key = `${row.table_schema}.${row.table_name}`;
    let table = tablesByKey.get(key);
    if (!table) {
      table = { schema: row.table_schema, name: row.table_name, columns: [] };
      tablesByKey.set(key, table);
    }
    const column: IntrospectedColumn = {
      name: row.column_name,
      dataType: mapInformationSchemaType(row.data_type),
      nullable: row.is_nullable === 'YES',
    };
    table.columns.push(column);
  }

  return Array.from(tablesByKey.values());
}

export async function introspectQuery(client: Client, sql: string): Promise<IntrospectedColumn[]> {
  // LIMIT 0 still plans and executes the query (so a bad query surfaces a
  // real error here, at author time) but returns no rows — cheap, and
  // field metadata is available regardless of row count.
  const result = await client.query(`select * from (${sql}) as introspection_subquery limit 0`);

  return result.fields.map((field) => ({
    name: field.name,
    dataType: mapOidType(field.dataTypeID),
    nullable: true, // not derivable from an ad-hoc query's result metadata
  }));
}
