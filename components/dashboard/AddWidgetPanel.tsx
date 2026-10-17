'use client';

import { useEffect, useState } from 'react';

import { WIDGET_REGISTRY, WIDGET_TYPES } from '@/components/widgets/registry';
import type { WidgetType } from '@/components/widgets/types';
import { createClient } from '@/lib/supabase/client';

type DatasetOption = { id: string; name: string };
type FieldOption = { id: string; name: string; label: string };

export function AddWidgetPanel({
  onAdd,
  onClose,
}: {
  onAdd: (input: { datasetId: string; widgetType: WidgetType; metricIds: string[]; dimensionIds: string[] }) => Promise<void>;
  onClose: () => void;
}) {
  const [datasets, setDatasets] = useState<DatasetOption[]>([]);
  const [datasetId, setDatasetId] = useState('');
  const [metrics, setMetrics] = useState<FieldOption[]>([]);
  const [dimensions, setDimensions] = useState<FieldOption[]>([]);
  const [selectedMetricIds, setSelectedMetricIds] = useState<string[]>([]);
  const [selectedDimensionIds, setSelectedDimensionIds] = useState<string[]>([]);
  const [widgetType, setWidgetType] = useState<WidgetType>('bar');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!id) {
      setMetrics([]);
      setDimensions([]);
      return;
    }
    const supabase = createClient();
    const [{ data: metricRows }, { data: dimensionRows }] = await Promise.all([
      supabase.from('metrics').select('id, name, label').eq('dataset_id', id),
      supabase.from('dimensions').select('id, name, label').eq('dataset_id', id),
    ]);
    setMetrics(metricRows ?? []);
    setDimensions(dimensionRows ?? []);
  }

  function toggle(list: string[], id: string, set: (next: string[]) => void) {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function handleAdd() {
    if (!datasetId || selectedMetricIds.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await onAdd({
        datasetId,
        widgetType,
        metricIds: selectedMetricIds,
        dimensionIds: selectedDimensionIds,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add widget');
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col border-l border-border bg-surface-raised p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Add widget</h2>
        <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary">
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">Dataset</label>
          <select
            value={datasetId}
            onChange={(e) => void handleDatasetChange(e.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-border bg-bg px-2 py-1.5 text-sm text-text-primary"
          >
            <option value="">Select…</option>
            {datasets.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-text-primary">Widget type</span>
          <div className="grid grid-cols-2 gap-1.5">
            {WIDGET_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setWidgetType(type)}
                className={`rounded-[var(--radius-sm)] border px-2 py-1 text-xs font-medium transition-colors ${
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
          <span className="mb-1 block text-sm font-medium text-text-primary">Metrics</span>
          {metrics.map((m) => (
            <label key={m.id} className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={selectedMetricIds.includes(m.id)}
                onChange={() => toggle(selectedMetricIds, m.id, setSelectedMetricIds)}
              />
              {m.label}
            </label>
          ))}
          {datasetId && metrics.length === 0 && <p className="text-xs text-text-muted">No metrics yet.</p>}
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-text-primary">Dimensions</span>
          {dimensions.map((d) => (
            <label key={d.id} className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={selectedDimensionIds.includes(d.id)}
                onChange={() => toggle(selectedDimensionIds, d.id, setSelectedDimensionIds)}
              />
              {d.label}
            </label>
          ))}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={!datasetId || selectedMetricIds.length === 0 || saving}
        className="mt-4 w-full rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {saving ? 'Adding…' : 'Add to dashboard'}
      </button>
    </div>
  );
}
