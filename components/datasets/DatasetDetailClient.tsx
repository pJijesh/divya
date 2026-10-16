'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Field = { id: string; source_column: string; data_type: string };
type Metric = { id: string; name: string; label: string; aggregation: string; format: string };
type Dimension = {
  id: string;
  name: string;
  label: string;
  type: string;
  time_grain: string | null;
  field_id: string;
};
type Dataset = {
  id: string;
  name: string;
  description: string | null;
  source_type: string;
  source_table_schema: string | null;
  source_table_name: string | null;
  source_sql: string | null;
  data_sources: { name: string } | null;
};

const AGGREGATIONS = ['sum', 'avg', 'count', 'count_distinct', 'min', 'max'] as const;
const FORMATS = ['number', 'currency', 'percent'] as const;
const TIME_GRAINS = ['day', 'week', 'month', 'quarter', 'year'] as const;

export function DatasetDetailClient({
  dataset,
  fields,
  initialMetrics,
  initialDimensions,
}: {
  dataset: Dataset;
  fields: Field[];
  initialMetrics: Metric[];
  initialDimensions: Dimension[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<'source' | 'semantic'>('semantic');
  const [metrics, setMetrics] = useState(initialMetrics);
  const [dimensions, setDimensions] = useState(initialDimensions);

  return (
    <main className="bg-bg min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="text-text-primary text-xl font-semibold">{dataset.name}</h1>
        <p className="text-text-secondary mt-1 text-sm">
          {dataset.data_sources?.name ?? 'Unknown data source'}
          {dataset.description ? ` · ${dataset.description}` : ''}
        </p>

        <div className="border-border mt-6 flex gap-6 border-b">
          <TabButton active={tab === 'source'} onClick={() => setTab('source')}>
            Source
          </TabButton>
          <TabButton active={tab === 'semantic'} onClick={() => setTab('semantic')}>
            Metrics &amp; Dimensions
          </TabButton>
        </div>

        {tab === 'source' ? (
          <SourceTab dataset={dataset} fields={fields} onRefreshed={() => router.refresh()} />
        ) : (
          <SemanticTab
            datasetId={dataset.id}
            fields={fields}
            metrics={metrics}
            dimensions={dimensions}
            onMetricsChange={setMetrics}
            onDimensionsChange={setDimensions}
          />
        )}
      </div>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
        active
          ? 'border-primary text-primary'
          : 'text-text-secondary hover:text-text-primary border-transparent'
      }`}
    >
      {children}
    </button>
  );
}

function SourceTab({
  dataset,
  fields,
  onRefreshed,
}: {
  dataset: Dataset;
  fields: Field[];
  onRefreshed: () => void;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{
    removedColumns: string[];
    addedColumns: string[];
    affected: { metrics: string[]; dimensions: string[] };
  } | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshError(null);
    const response = await fetch(`/api/datasets/${dataset.id}/refresh-schema`, { method: 'POST' });
    const body = await response.json();
    setRefreshing(false);

    if (!response.ok) {
      setRefreshError(body.error ?? 'Could not refresh schema');
      return;
    }

    setRefreshResult(body);
    onRefreshed();
  }

  const hasAffected =
    refreshResult &&
    (refreshResult.affected.metrics.length > 0 || refreshResult.affected.dimensions.length > 0);

  return (
    <div className="mt-6 space-y-4">
      <div>
        <span className="text-text-primary text-sm font-medium">Type</span>
        <p className="text-text-secondary text-sm">{dataset.source_type}</p>
      </div>

      {dataset.source_type === 'table' ? (
        <div>
          <span className="text-text-primary text-sm font-medium">Table</span>
          <p className="text-text-secondary font-mono text-sm">
            {dataset.source_table_schema}.{dataset.source_table_name}
          </p>
        </div>
      ) : (
        <div>
          <span className="text-text-primary text-sm font-medium">Query</span>
          <pre className="border-border bg-surface text-text-secondary mt-1 overflow-x-auto rounded-[var(--radius-sm)] border p-3 font-mono text-xs">
            {dataset.source_sql}
          </pre>
        </div>
      )}

      <div>
        <span className="text-text-primary text-sm font-medium">Fields ({fields.length})</span>
        <ul className="text-text-secondary mt-1 space-y-1 text-sm">
          {fields.map((f) => (
            <li key={f.id}>
              {f.source_column} <span className="text-text-muted">· {f.data_type}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={handleRefresh}
        disabled={refreshing}
        className="border-border text-text-primary hover:bg-surface rounded-[var(--radius-sm)] border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60"
      >
        {refreshing ? 'Refreshing…' : 'Refresh schema'}
      </button>

      {refreshError && <p className="text-danger text-sm">{refreshError}</p>}

      {refreshResult && !hasAffected && (
        <p className="text-success text-sm">
          Schema refreshed — {refreshResult.addedColumns.length} added,{' '}
          {refreshResult.removedColumns.length} removed.
        </p>
      )}

      {hasAffected && (
        <div className="border-warning/30 bg-warning/10 text-text-primary rounded-[var(--radius-sm)] border p-3 text-sm">
          <p className="font-medium">Some metrics/dimensions use columns that no longer exist:</p>
          <ul className="text-text-secondary mt-1 list-inside list-disc">
            {refreshResult!.affected.metrics.map((label) => (
              <li key={`metric-${label}`}>{label} (metric)</li>
            ))}
            {refreshResult!.affected.dimensions.map((label) => (
              <li key={`dimension-${label}`}>{label} (dimension)</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SemanticTab({
  datasetId,
  fields,
  metrics,
  dimensions,
  onMetricsChange,
  onDimensionsChange,
}: {
  datasetId: string;
  fields: Field[];
  metrics: Metric[];
  dimensions: Dimension[];
  onMetricsChange: (metrics: Metric[]) => void;
  onDimensionsChange: (dimensions: Dimension[]) => void;
}) {
  return (
    <div className="mt-6 grid gap-8 sm:grid-cols-2">
      <MetricsPanel
        datasetId={datasetId}
        fields={fields}
        metrics={metrics}
        onChange={onMetricsChange}
      />
      <DimensionsPanel
        datasetId={datasetId}
        fields={fields}
        dimensions={dimensions}
        onChange={onDimensionsChange}
      />
    </div>
  );
}

function MetricsPanel({
  datasetId,
  fields,
  metrics,
  onChange,
}: {
  datasetId: string;
  fields: Field[];
  metrics: Metric[];
  onChange: (metrics: Metric[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [fieldId, setFieldId] = useState('');
  const [label, setLabel] = useState('');
  const [aggregation, setAggregation] = useState<(typeof AGGREGATIONS)[number]>('sum');
  const [format, setFormat] = useState<(typeof FORMATS)[number]>('number');
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!fieldId || !label.trim()) return;
    setError(null);

    const response = await fetch(`/api/datasets/${datasetId}/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldId, label, aggregation, format }),
    });
    const body = await response.json();

    if (!response.ok) {
      setError(body.error ?? 'Could not add metric');
      return;
    }

    onChange([...metrics, body.metric]);
    setAdding(false);
    setFieldId('');
    setLabel('');
  }

  async function handleDelete(metricId: string) {
    await fetch(`/api/datasets/${datasetId}/metrics/${metricId}`, { method: 'DELETE' });
    onChange(metrics.filter((m) => m.id !== metricId));
  }

  return (
    <div>
      <h2 className="text-text-primary text-sm font-semibold">Metrics</h2>
      <ul className="mt-3 space-y-2">
        {metrics.map((m) => (
          <li
            key={m.id}
            className="border-border bg-surface-raised flex items-center justify-between rounded-[var(--radius-sm)] border px-3 py-2 text-sm"
          >
            <span className="text-text-primary">
              {m.label} <span className="text-text-muted">· {m.aggregation}</span>
            </span>
            <button
              type="button"
              onClick={() => handleDelete(m.id)}
              className="text-text-muted hover:text-danger"
            >
              Remove
            </button>
          </li>
        ))}
        {metrics.length === 0 && <li className="text-text-muted text-sm">No metrics yet.</li>}
      </ul>

      {adding ? (
        <div className="border-border bg-surface mt-3 space-y-2 rounded-[var(--radius-sm)] border p-3">
          <input
            placeholder="Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="border-border bg-bg text-text-primary w-full rounded-[var(--radius-sm)] border px-2 py-1.5 text-sm"
          />
          <select
            value={fieldId}
            onChange={(e) => setFieldId(e.target.value)}
            className="border-border bg-bg text-text-primary w-full rounded-[var(--radius-sm)] border px-2 py-1.5 text-sm"
          >
            <option value="">Field…</option>
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.source_column}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              value={aggregation}
              onChange={(e) => setAggregation(e.target.value as typeof aggregation)}
              className="border-border bg-bg text-text-primary flex-1 rounded-[var(--radius-sm)] border px-2 py-1.5 text-sm"
            >
              {AGGREGATIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as typeof format)}
              className="border-border bg-bg text-text-primary flex-1 rounded-[var(--radius-sm)] border px-2 py-1.5 text-sm"
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-danger text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              className="bg-primary rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="border-border text-text-secondary rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-primary hover:text-primary-hover mt-3 text-sm"
        >
          + Add metric
        </button>
      )}
    </div>
  );
}

function DimensionsPanel({
  datasetId,
  fields,
  dimensions,
  onChange,
}: {
  datasetId: string;
  fields: Field[];
  dimensions: Dimension[];
  onChange: (dimensions: Dimension[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [fieldId, setFieldId] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState<'categorical' | 'time'>('categorical');
  const [timeGrain, setTimeGrain] = useState<(typeof TIME_GRAINS)[number]>('day');
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!fieldId || !label.trim()) return;
    setError(null);

    const response = await fetch(`/api/datasets/${datasetId}/dimensions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldId,
        label,
        type,
        timeGrain: type === 'time' ? timeGrain : undefined,
      }),
    });
    const body = await response.json();

    if (!response.ok) {
      setError(body.error ?? 'Could not add dimension');
      return;
    }

    onChange([...dimensions, body.dimension]);
    setAdding(false);
    setFieldId('');
    setLabel('');
  }

  async function handleDelete(dimensionId: string) {
    await fetch(`/api/datasets/${datasetId}/dimensions/${dimensionId}`, { method: 'DELETE' });
    onChange(dimensions.filter((d) => d.id !== dimensionId));
  }

  return (
    <div>
      <h2 className="text-text-primary text-sm font-semibold">Dimensions</h2>
      <ul className="mt-3 space-y-2">
        {dimensions.map((d) => (
          <li
            key={d.id}
            className="border-border bg-surface-raised flex items-center justify-between rounded-[var(--radius-sm)] border px-3 py-2 text-sm"
          >
            <span className="text-text-primary">
              {d.label}{' '}
              <span className="text-text-muted">
                · {d.type}
                {d.time_grain ? ` (${d.time_grain})` : ''}
              </span>
            </span>
            <button
              type="button"
              onClick={() => handleDelete(d.id)}
              className="text-text-muted hover:text-danger"
            >
              Remove
            </button>
          </li>
        ))}
        {dimensions.length === 0 && <li className="text-text-muted text-sm">No dimensions yet.</li>}
      </ul>

      {adding ? (
        <div className="border-border bg-surface mt-3 space-y-2 rounded-[var(--radius-sm)] border p-3">
          <input
            placeholder="Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="border-border bg-bg text-text-primary w-full rounded-[var(--radius-sm)] border px-2 py-1.5 text-sm"
          />
          <select
            value={fieldId}
            onChange={(e) => setFieldId(e.target.value)}
            className="border-border bg-bg text-text-primary w-full rounded-[var(--radius-sm)] border px-2 py-1.5 text-sm"
          >
            <option value="">Field…</option>
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.source_column}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="border-border bg-bg text-text-primary flex-1 rounded-[var(--radius-sm)] border px-2 py-1.5 text-sm"
            >
              <option value="categorical">Categorical</option>
              <option value="time">Time</option>
            </select>
            {type === 'time' && (
              <select
                value={timeGrain}
                onChange={(e) => setTimeGrain(e.target.value as typeof timeGrain)}
                className="border-border bg-bg text-text-primary flex-1 rounded-[var(--radius-sm)] border px-2 py-1.5 text-sm"
              >
                {TIME_GRAINS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            )}
          </div>
          {error && <p className="text-danger text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              className="bg-primary rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="border-border text-text-secondary rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-primary hover:text-primary-hover mt-3 text-sm"
        >
          + Add dimension
        </button>
      )}
    </div>
  );
}
