'use client';

import { EChartsBase } from '@/components/widgets/shared/EChartsBase';
import type { WidgetComponentProps } from '@/components/widgets/types';

export function PieWidget({ data, config }: WidgetComponentProps) {
  const dimKey = config.dimensions[0]?.key;
  const metric = config.metrics[0];
  if (!dimKey || !metric) return null;

  const pieData = data.rows.map((r) => ({
    name: String(r[dimKey] ?? ''),
    value: Number(r[metric.key] ?? 0),
  }));

  return (
    <EChartsBase
      option={{
        series: [
          {
            type: 'pie',
            radius: ['45%', '72%'],
            avoidLabelOverlap: true,
            // No borderColor override: ECharts paints to canvas, which
            // can't resolve CSS custom properties (var(...) is a DOM/CSSOM
            // concept) — a var() string here would just silently fail.
            // The default border reads fine against both themes.
            itemStyle: { borderWidth: 1 },
            label: { show: false },
            data: pieData,
          },
        ],
      }}
    />
  );
}
