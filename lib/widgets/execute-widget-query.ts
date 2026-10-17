import 'server-only';

import { getConnector } from '@/lib/connectors/registry';
import { compileQuery, QueryCompilerError } from '@/lib/semantic/query-compiler';
import type { Aggregation, TimeGrain } from '@/lib/semantic/types';
import { createClient } from '@/lib/supabase/server';

export interface WidgetQueryInput {
  datasetId: string;
  metricIds: string[];
  dimensionIds: string[];
}

export interface WidgetQuerySuccess {
  ok: true;
  rows: Record<string, unknown>[];
  dimensionKeys: string[];
  metricKeys: string[];
  metrics: { key: string; label: string; format: string }[];
  dimensions: { key: string; label: string }[];
  truncated: boolean;
}

export interface WidgetQueryFailure {
  ok: false;
  status: number;
  error: string;
}

export type WidgetQueryOutcome = WidgetQuerySuccess | WidgetQueryFailure;

// Shared by /api/widgets/preview (ad-hoc, not persisted) and
// /api/dashboards/[id]/widgets/[widgetId]/data (reads a saved
// dashboard_widgets row) — both resolve to the same
// {datasetId, metricIds, dimensionIds} shape and from there the path is
// identical: compile, execute, shape the result. Keeping this in one
// place means a change to how widgets fetch data only has to happen once.
export async function executeWidgetQuery(input: WidgetQueryInput): Promise<WidgetQueryOutcome> {
  const supabase = await createClient();

  const { data: dataset, error: datasetError } = await supabase
    .from('datasets')
    .select(
      'id, source_type, source_table_schema, source_table_name, source_sql, data_sources(id, type, host, port, database_name, username, ssl_mode)',
    )
    .eq('id', input.datasetId)
    .single();

  if (datasetError || !dataset || !dataset.data_sources) {
    return { ok: false, status: 404, error: 'Dataset not found' };
  }

  const { data: metricRows, error: metricsError } = await supabase
    .from('metrics')
    .select('id, name, label, aggregation, format, expression')
    .in('id', input.metricIds)
    .eq('dataset_id', input.datasetId);

  if (metricsError || !metricRows || metricRows.length !== input.metricIds.length) {
    return { ok: false, status: 404, error: 'One or more metrics not found' };
  }

  const { data: dimensionRows, error: dimensionsError } =
    input.dimensionIds.length > 0
      ? await supabase
          .from('dimensions')
          .select('id, name, label, type, time_grain, dataset_fields(source_column)')
          .in('id', input.dimensionIds)
          .eq('dataset_id', input.datasetId)
      : { data: [], error: null };

  if (dimensionsError || !dimensionRows || dimensionRows.length !== input.dimensionIds.length) {
    return { ok: false, status: 404, error: 'One or more dimensions not found' };
  }

  const { data: decryptedPassword, error: secretError } = await supabase.rpc('get_data_source_secret', {
    data_source_row_id: dataset.data_sources.id,
  });

  if (secretError || !decryptedPassword) {
    return { ok: false, status: 500, error: secretError?.message ?? 'Could not read credential' };
  }

  let compiled;
  try {
    compiled = compileQuery({
      source:
        dataset.source_type === 'table'
          ? { sourceType: 'table', schema: dataset.source_table_schema!, table: dataset.source_table_name! }
          : { sourceType: 'query', sql: dataset.source_sql! },
      dimensions: dimensionRows.map((d) => ({
        alias: d.name,
        fieldColumn: d.dataset_fields!.source_column,
        timeGrain: d.type === 'time' ? (d.time_grain as TimeGrain) : undefined,
      })),
      metrics: metricRows.map((m) => ({
        alias: m.name,
        fieldColumn: (m.expression as { source_column: string }).source_column,
        aggregation: m.aggregation as Aggregation,
      })),
      filters: [],
    });
  } catch (err) {
    const message = err instanceof QueryCompilerError ? err.message : 'Could not build query';
    return { ok: false, status: 400, error: message };
  }

  const connector = getConnector(dataset.data_sources.type);

  try {
    const result = await connector.execute(
      {
        host: dataset.data_sources.host,
        port: dataset.data_sources.port,
        database: dataset.data_sources.database_name,
        username: dataset.data_sources.username,
        decryptedPassword,
        sslMode: dataset.data_sources.ssl_mode as 'require' | 'disable' | 'verify-full',
      },
      { sql: compiled.sql, params: compiled.params, timeoutMs: 15_000, maxRows: 10_000 },
    );

    // Row order out of pg matches SELECT order: dimensions, then metrics
    // (see lib/semantic/query-compiler.ts) — zip positionally.
    const dimensionKeys = dimensionRows.map((d) => d.name);
    const metricKeys = metricRows.map((m) => m.name);
    const orderedKeys = [...dimensionKeys, ...metricKeys];

    const rows = result.rows.map((row) =>
      Object.fromEntries(orderedKeys.map((key, i) => [key, row[i]])),
    );

    return {
      ok: true,
      rows,
      dimensionKeys,
      metricKeys,
      metrics: metricRows.map((m) => ({ key: m.name, label: m.label, format: m.format })),
      dimensions: dimensionRows.map((d) => ({ key: d.name, label: d.label })),
      truncated: result.truncated,
    };
  } catch (err) {
    return { ok: false, status: 502, error: err instanceof Error ? err.message : 'Query execution failed' };
  }
}
