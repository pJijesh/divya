'use client';

import { useQuery } from '@tanstack/react-query';

import type { WidgetDataset, WidgetVisualConfig } from './types';

export function useWidgetData(dashboardId: string, widgetId: string) {
  return useQuery({
    queryKey: ['widget-data', dashboardId, widgetId],
    queryFn: async (): Promise<{ data: WidgetDataset; config: WidgetVisualConfig }> => {
      const response = await fetch(`/api/dashboards/${dashboardId}/widgets/${widgetId}/data`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Could not load data');

      return {
        data: { rows: body.rows, dimensionKeys: body.dimensionKeys, metricKeys: body.metricKeys },
        config: { dimensions: body.dimensions, metrics: body.metrics },
      };
    },
  });
}
