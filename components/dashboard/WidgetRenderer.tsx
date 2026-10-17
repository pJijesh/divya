'use client';

import { WIDGET_REGISTRY } from '@/components/widgets/registry';
import { WidgetCard, WidgetEmpty, WidgetError, WidgetLoading } from '@/components/widgets/shared/WidgetCard';
import type { WidgetType } from '@/components/widgets/types';
import { useWidgetData } from '@/components/widgets/useWidgetData';

// Shared by the designer canvas and the viewer — both just hand it a
// dashboardId + widgetId and get the same fetch/loading/error/empty
// handling for free (docs/UI.md §5.1, §4.3).
export function WidgetRenderer({
  dashboardId,
  widgetId,
  widgetType,
  title,
  onRemove,
}: {
  dashboardId: string;
  widgetId: string;
  widgetType: WidgetType;
  title?: string | null;
  onRemove?: () => void;
}) {
  const { data, isLoading, error, refetch } = useWidgetData(dashboardId, widgetId);
  const Widget = WIDGET_REGISTRY[widgetType].component;

  return (
    <WidgetCard title={title ?? WIDGET_REGISTRY[widgetType].label} onRemove={onRemove}>
      {isLoading ? (
        <WidgetLoading />
      ) : error ? (
        <WidgetError message={error.message} onRetry={() => refetch()} />
      ) : data && data.data.rows.length === 0 ? (
        <WidgetEmpty />
      ) : data ? (
        <Widget data={data.data} config={data.config} />
      ) : null}
    </WidgetCard>
  );
}
