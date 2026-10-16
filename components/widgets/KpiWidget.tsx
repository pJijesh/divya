import { formatMetricValue } from '@/lib/utils/format';

import type { WidgetComponentProps } from './types';

// No delta/comparison-period support yet (needs a prior-period query,
// which the query-compiler doesn't build today) — just the raw value,
// per docs/UI.md §5.3's base case.
export function KpiWidget({ data, config }: WidgetComponentProps) {
  const metric = config.metrics[0];
  if (!metric) return null;

  const value = data.rows[0]?.[metric.key];

  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <span className="text-text-secondary text-sm">{metric.label}</span>
      <span className="text-text-primary mt-1 text-3xl font-semibold">
        {formatMetricValue(value, metric.format)}
      </span>
    </div>
  );
}
