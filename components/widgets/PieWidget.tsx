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
            itemStyle: { borderColor: 'var(--color-surface-raised)', borderWidth: 2 },
            label: { show: false },
            data: pieData,
          },
        ],
      }}
    />
  );
}
