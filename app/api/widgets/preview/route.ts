import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentOrgMembership } from '@/lib/auth/current-org';
import { getConnector } from '@/lib/connectors/registry';
import { compileQuery, QueryCompilerError } from '@/lib/semantic/query-compiler';
import type { Aggregation, TimeGrain } from '@/lib/semantic/types';
import { createClient } from '@/lib/supabase/server';

const previewRequestSchema = z.object({
  datasetId: z.uuid(),
  metricIds: z.array(z.uuid()).min(1, 'At least one metric is required'),
  dimensionIds: z.array(z.uuid()).default([]),
});

// Executes a widget's {dataset, metrics, dimensions} against the real
// connector — used by both the standalone widget preview page and (once
// built) the dashboard designer/viewer's widget data-fetch. Not tied to a
// persisted dashboard_widgets row, so widget configs can be tested before
// a dashboard exists at all.
export async function POST(request: Request) {
  const membership = await getCurrentOrgMembership();
  if (!membership) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = previewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data: dataset, error: datasetError } = await supabase
    .from('datasets')
    .select(
      'id, source_type, source_table_schema, source_table_name, source_sql, data_sources(id, type, host, port, database_name, username, ssl_mode)',
    )
    .eq('id', parsed.data.datasetId)
    .single();

  if (datasetError || !dataset || !dataset.data_sources) {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
  }

  const { data: metricRows, error: metricsError } = await supabase
    .from('metrics')
    .select('id, name, label, aggregation, format, expression')
    .in('id', parsed.data.metricIds)
    .eq('dataset_id', parsed.data.datasetId);

  if (metricsError || !metricRows || metricRows.length !== parsed.data.metricIds.length) {
    return NextResponse.json({ error: 'One or more metrics not found' }, { status: 404 });
  }

  const { data: dimensionRows, error: dimensionsError } =
    parsed.data.dimensionIds.length > 0
      ? await supabase
          .from('dimensions')
          .select('id, name, label, type, time_grain, dataset_fields(source_column)')
          .in('id', parsed.data.dimensionIds)
          .eq('dataset_id', parsed.data.datasetId)
      : { data: [], error: null };

  if (
    dimensionsError ||
    !dimensionRows ||
    dimensionRows.length !== parsed.data.dimensionIds.length
  ) {
    return NextResponse.json({ error: 'One or more dimensions not found' }, { status: 404 });
  }

  const { data: decryptedPassword, error: secretError } = await supabase.rpc(
    'get_data_source_secret',
    {
      data_source_row_id: dataset.data_sources.id,
    },
  );

  if (secretError || !decryptedPassword) {
    return NextResponse.json(
      { error: secretError?.message ?? 'Could not read credential' },
      { status: 500 },
    );
  }

  let compiled;
  try {
    compiled = compileQuery({
      source:
        dataset.source_type === 'table'
          ? {
              sourceType: 'table',
              schema: dataset.source_table_schema!,
              table: dataset.source_table_name!,
            }
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
    return NextResponse.json({ error: message }, { status: 400 });
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
    // (see lib/semantic/query-compiler.ts) — zip positionally rather than
    // re-deriving column names from the driver's result metadata.
    const dimensionKeys = dimensionRows.map((d) => d.name);
    const metricKeys = metricRows.map((m) => m.name);
    const orderedKeys = [...dimensionKeys, ...metricKeys];

    const rows = result.rows.map((row) =>
      Object.fromEntries(orderedKeys.map((key, i) => [key, row[i]])),
    );

    return NextResponse.json({
      rows,
      dimensionKeys,
      metricKeys,
      metrics: metricRows.map((m) => ({ key: m.name, label: m.label, format: m.format })),
      dimensions: dimensionRows.map((d) => ({ key: d.name, label: d.label })),
      truncated: result.truncated,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Query execution failed' },
      { status: 502 },
    );
  }
}
