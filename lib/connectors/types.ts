// Connector abstraction. Route Handlers and the semantic query-compiler
// only ever talk to this interface via lib/connectors/registry.ts — never
// to a specific driver — so adding MySQL/REST connectors in a later phase
// means implementing and registering, not touching dashboards/widgets/the
// compiler.

export interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  decryptedPassword: string;
  sslMode: 'require' | 'disable' | 'verify-full';
  options?: Record<string, unknown>;
}

export type FieldDataType = 'string' | 'number' | 'date' | 'boolean' | 'json';

export interface IntrospectedColumn {
  name: string;
  dataType: FieldDataType;
  nullable: boolean;
}

export interface IntrospectedTable {
  schema: string;
  name: string;
  columns: IntrospectedColumn[];
}

export interface QueryRequest {
  // Produced by the semantic query-compiler, never raw user input for
  // metric/dimension widgets — see lib/semantic/query-compiler.ts.
  sql: string;
  params: unknown[];
  timeoutMs: number;
  maxRows: number;
}

export interface QueryResult {
  columns: { name: string; dataType: string }[];
  rows: unknown[][];
  truncated: boolean;
}

export interface TestConnectionResult {
  ok: boolean;
  error?: string;
  tableCount?: number;
}

export interface Connector {
  type: string;
  testConnection(config: ConnectionConfig): Promise<TestConnectionResult>;
  listTables(config: ConnectionConfig): Promise<IntrospectedTable[]>;
  introspectQuery(config: ConnectionConfig, sql: string): Promise<IntrospectedColumn[]>;
  execute(config: ConnectionConfig, request: QueryRequest): Promise<QueryResult>;
}
