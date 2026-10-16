'use client';

import { EChartsBase } from '@/components/widgets/shared/EChartsBase';
import type { WidgetComponentProps } from '@/components/widgets/types';

export function BarWidget({ data, config }: WidgetComponentProps) {
  const dimKey = config.dimensions[0]?.key;
  const categories = dimKey ? data.rows.map((r) => String(r[dimKey] ?? '')) : [];

  const series = config.metrics.map((metric) => ({
    name: metric.label,
    type: 'bar' as const,
    data: data.rows.map((r) => Number(r[metric.key] ?? 0)),
  }));

  return (
    <EChartsBase
      option={{
        xAxis: { type: 'category', data: categories, axisLabel: { hideOverlap: true } },
        yAxis: { type: 'value' },
        series,
      }}
    />
  );
}
