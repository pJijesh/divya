'use client';

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { useMemo, useState } from 'react';

import { formatMetricValue } from '@/lib/utils/format';

import type { WidgetComponentProps, WidgetDataRow } from './types';

export function TableWidget({ data, config }: WidgetComponentProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<WidgetDataRow>[]>(() => {
    const dimensionColumns: ColumnDef<WidgetDataRow>[] = config.dimensions.map((dim) => ({
      id: dim.key,
      accessorKey: dim.key,
      header: dim.label,
      cell: (info) => String(info.getValue() ?? ''),
    }));

    const metricColumns: ColumnDef<WidgetDataRow>[] = config.metrics.map((metric) => ({
      id: metric.key,
      accessorKey: metric.key,
      header: metric.label,
      cell: (info) => formatMetricValue(info.getValue(), metric.format),
    }));

    return [...dimensionColumns, ...metricColumns];
  }, [config.dimensions, config.metrics]);

  const table = useReactTable({
    data: data.rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface-raised sticky top-0">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="border-border text-text-secondary cursor-pointer border-b px-2 py-1.5 text-left font-medium select-none"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-border border-b last:border-0">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="text-text-primary px-2 py-1.5">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
