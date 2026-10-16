'use client';

import { useEffect, useState } from 'react';

import {
  WidgetCard,
  WidgetEmpty,
  WidgetError,
  WidgetLoading,
} from '@/components/widgets/shared/WidgetCard';
import { WIDGET_REGISTRY, WIDGET_TYPES } from '@/components/widgets/registry';
import type { WidgetDataset, WidgetType, WidgetVisualConfig } from '@/components/widgets/types';
import { createClient } from '@/lib/supabase/client';

type DatasetOption = { id: string; name: string };
type FieldOption = { id: string; name: string; label: string; format?: string };

export default function WidgetPreviewPage() {
  const [datasets, setDatasets] = useState<DatasetOption[]>([]);
  const [datasetId, setDatasetId] = useState('');

  const [metrics, setMetrics] = useState<FieldOption[]>([]);
  const [dimensions, setDimensions] = useState<FieldOption[]>([]);
  const [selectedMetricIds, setSelectedMetricIds] = useState<string[]>([]);
  const [selectedDimensionIds, setSelectedDimensionIds] = useState<string[]>([]);

  const [widgetType, setWidgetType] = useState<WidgetType>('bar');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ data: WidgetDataset; config: WidgetVisualConfig } | null>(
    null,
  );

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('datasets')
      .select('id, name')
      .is('deleted_at', null)
      .then(({ data }) => setDatasets(data ?? []));
  }, []);

  async function handleDatasetChange(id: string) {
    setDatasetId(id);
    setSelectedMetricIds([]);
    setSelectedDimensionIds([]);
    setResult(null);
    if (!id) {
      setMetrics([]);
      setDimensions([]);
      return;
    }

    const supabase = createClient();
    const [{ data: metricRows }, { data: dimensionRows }] = await Promise.all([
      supabase.from('metrics').select('id, name, label, format').eq('dataset_id', id),
      supabase.from('dimensions').select('id, name, label').eq('dataset_id', id),
    ]);
    setMetrics(metricRows ?? []);
    setDimensions(dimensionRows ?? []);
  }

  function toggle(list: string[], id: string, set: (next: string[]) => void) {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function handlePreview() {
    if (selectedMetricIds.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const response = await fetch('/api/widgets/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        datasetId,
        metricIds: selectedMetricIds,
        dimensionIds: selectedDimensionIds,
      }),
    });
    const body = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(body.error ?? 'Could not load preview');
      return;
    }

    setResult({
      data: { rows: body.rows, dimensionKeys: body.dimensionKeys, metricKeys: body.metricKeys },
      config: { dimensions: body.dimensions, metrics: body.metrics },
    });
  }

  const Widget = WIDGET_REGISTRY[widgetType].component;

  return (
    <main className="bg-bg min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-text-primary mb-6 text-xl font-semibold">Widget preview</h1>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-5">
            <div>
              <label className="text-text-primary mb-1 block text-sm font-medium">Dataset</label>
              <select
                value={datasetId}
                onChange={(e) => void handleDatasetChange(e.target.value)}
                className="border-border bg-bg text-text-primary w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm"
              >
                <option value="">Select a dataset…</option>
                {datasets.map((ds) => (
                  <option key={ds.id} value={ds.id}>
                    {ds.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-text-primary mb-1 block text-sm font-medium">
                Widget type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {WIDGET_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setWidgetType(type)}
                    className={`rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-medium transition-colors ${
                      widgetType === type
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-text-secondary hover:bg-surface'
                    }`}
                  >
                    {WIDGET_REGISTRY[type].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-text-primary mb-1 block text-sm font-medium">Metrics</span>
              <div className="space-y-1">
                {metrics.map((m) => (
                  <label key={m.id} className="text-text-secondary flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedMetricIds.includes(m.id)}
                      onChange={() => toggle(selectedMetricIds, m.id, setSelectedMetricIds)}
                    />
                    {m.label}
                  </label>
                ))}
                {metrics.length === 0 && (
                  <p className="text-text-muted text-xs">No metrics on this dataset.</p>
                )}
              </div>
            </div>

            <div>
              <span className="text-text-primary mb-1 block text-sm font-medium">Dimensions</span>
              <div className="space-y-1">
                {dimensions.map((d) => (
                  <label key={d.id} className="text-text-secondary flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedDimensionIds.includes(d.id)}
                      onChange={() => toggle(selectedDimensionIds, d.id, setSelectedDimensionIds)}
                    />
                    {d.label}
                  </label>
                ))}
                {dimensions.length === 0 && (
                  <p className="text-text-muted text-xs">No dimensions on this dataset.</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handlePreview}
              disabled={!datasetId || selectedMetricIds.length === 0 || loading}
              className="bg-primary hover:bg-primary-hover w-full rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60"
            >
              {loading ? 'Loading…' : 'Preview'}
            </button>
          </div>

          <div className="h-[420px]">
            <WidgetCard title={result ? WIDGET_REGISTRY[widgetType].label : undefined}>
              {loading ? (
                <WidgetLoading />
              ) : error ? (
                <WidgetError message={error} onRetry={handlePreview} />
              ) : result && result.data.rows.length === 0 ? (
                <WidgetEmpty />
              ) : result ? (
                <Widget data={result.data} config={result.config} />
              ) : (
                <div className="text-text-muted flex h-full items-center justify-center text-sm">
                  Pick a dataset, metrics, and a widget type, then preview.
                </div>
              )}
            </WidgetCard>
          </div>
        </div>
      </div>
    </main>
  );
}
