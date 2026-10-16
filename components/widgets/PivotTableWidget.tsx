'use client';

import { useMemo } from 'react';

import { formatMetricValue } from '@/lib/utils/format';

import { TableWidget } from './TableWidget';
import type { WidgetComponentProps } from './types';

// "Pivot-ish" per the plan, not a full pivot engine: cross-tabs exactly
// when there are 2 dimensions + 1 metric (rows = dim1, columns = dim2,
// cells = metric). Anything else falls back to the flat TableWidget —
// a real N-dimensional pivot UI is a later-phase feature.
export function PivotTableWidget({ data, config }: WidgetComponentProps) {
  const canPivot = config.dimensions.length === 2 && config.metrics.length === 1;

  const pivot = useMemo(() => {
    if (!canPivot) return null;
    const [rowDim, colDim] = config.dimensions;
    const metric = config.metrics[0];

    const rowValues: string[] = [];
    const colValues: string[] = [];
    const cellMap = new Map<string, unknown>();

    for (const row of data.rows) {
      const rowKey = String(row[rowDim.key] ?? '');
      const colKey = String(row[colDim.key] ?? '');
      if (!rowValues.includes(rowKey)) rowValues.push(rowKey);
      if (!colValues.includes(colKey)) colValues.push(colKey);
      cellMap.set(`${rowKey}\u0000${colKey}`, row[metric.key]);
    }

    return { rowDim, colDim, metric, rowValues, colValues, cellMap };
  }, [canPivot, config.dimensions, config.metrics, data.rows]);

  if (!pivot) {
    return <TableWidget data={data} config={config} />;
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface-raised sticky top-0">
          <tr>
            <th className="border-border text-text-secondary border-b px-2 py-1.5 text-left font-medium">
              {pivot.rowDim.label}
            </th>
            {pivot.colValues.map((col) => (
              <th
                key={col}
                className="border-border text-text-secondary border-b px-2 py-1.5 text-right font-medium"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pivot.rowValues.map((row) => (
            <tr key={row} className="border-border border-b last:border-0">
              <td className="text-text-primary px-2 py-1.5 font-medium">{row}</td>
              {pivot.colValues.map((col) => (
                <td key={col} className="text-text-primary px-2 py-1.5 text-right">
                  {formatMetricValue(pivot.cellMap.get(`${row}\u0000${col}`), pivot.metric.format)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
