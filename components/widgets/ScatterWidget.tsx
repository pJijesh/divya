'use client';

import { EChartsBase } from '@/components/widgets/shared/EChartsBase';
import type { WidgetComponentProps } from '@/components/widgets/types';

// Plots the first two metrics against each other (x, y), one point per
// row — the dimension (if present) only labels points in the tooltip.
export function ScatterWidget({ data, config }: WidgetComponentProps) {
  const [xMetric, yMetric] = config.metrics;
  const dimKey = config.dimensions[0]?.key;
  if (!xMetric || !yMetric) return null;

  const points = data.rows.map((r) => [
    Number(r[xMetric.key] ?? 0),
    Number(r[yMetric.key] ?? 0),
    dimKey ? String(r[dimKey] ?? '') : undefined,
  ]);

  return (
    <EChartsBase
      option={{
        xAxis: { type: 'value', name: xMetric.label },
        yAxis: { type: 'value', name: yMetric.label },
        series: [{ type: 'scatter', data: points, symbolSize: 10 }],
        tooltip: {
          trigger: 'item',
          // ECharts' formatter param type is a loose union across chart
          // types; our series data shape is known here, so cast at the
          // boundary rather than fighting the library's generic typing.
          formatter: (params) => {
            const [x, y, name] = (
              params as unknown as { data: [number, number, string | undefined] }
            ).data;
            return `${name ? `${name}<br/>` : ''}${xMetric.label}: ${x}<br/>${yMetric.label}: ${y}`;
          },
        },
      }}
    />
  );
}
