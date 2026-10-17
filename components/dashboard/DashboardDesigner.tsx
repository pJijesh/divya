'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import GridLayout, { WidthProvider } from 'react-grid-layout';

import { AddWidgetPanel } from '@/components/dashboard/AddWidgetPanel';
import { WidgetRenderer } from '@/components/dashboard/WidgetRenderer';
import type { WidgetType } from '@/components/widgets/types';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(GridLayout);

type Layout = { x: number; y: number; w: number; h: number };
type DashboardWidget = {
  id: string;
  widget_type: WidgetType;
  title: string | null;
  layout: Layout;
};

export function DashboardDesigner({
  dashboardId,
  dashboardName,
  isPublished,
  initialWidgets,
}: {
  dashboardId: string;
  dashboardName: string;
  isPublished: boolean;
  initialWidgets: DashboardWidget[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [widgets, setWidgets] = useState(initialWidgets);
  const [published, setPublished] = useState(isPublished);
  const [publishing, setPublishing] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  async function handleAddWidget(input: {
    datasetId: string;
    widgetType: WidgetType;
    metricIds: string[];
    dimensionIds: string[];
  }) {
    const response = await fetch(`/api/dashboards/${dashboardId}/widgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? 'Could not add widget');

    setWidgets((prev) => [...prev, body.widget]);
    setPanelOpen(false);
  }

  async function handleRemoveWidget(widgetId: string) {
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
    await fetch(`/api/dashboards/${dashboardId}/widgets/${widgetId}`, { method: 'DELETE' });
  }

  async function handleLayoutChange(
    nextLayout: { i: string; x: number; y: number; w: number; h: number }[],
  ) {
    setWidgets((prev) =>
      prev.map((w) => {
        const item = nextLayout.find((l) => l.i === w.id);
        return item ? { ...w, layout: { x: item.x, y: item.y, w: item.w, h: item.h } } : w;
      }),
    );

    setSaveState('saving');
    await Promise.all(
      nextLayout.map((item) =>
        fetch(`/api/dashboards/${dashboardId}/widgets/${item.i}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ layout: { x: item.x, y: item.y, w: item.w, h: item.h } }),
        }),
      ),
    );
    setSaveState('saved');
  }

  async function handlePublishToggle() {
    setPublishing(true);
    const next = !published;
    const response = await fetch(`/api/dashboards/${dashboardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: next }),
    });
    setPublishing(false);
    if (response.ok) {
      setPublished(next);
      // Published widgets become readable by viewer-role users — any
      // cached "not found" from a viewer's earlier attempt should clear.
      queryClient.invalidateQueries({ queryKey: ['widget-data'] });
    }
  }

  const gridLayout = widgets.map((w) => ({ i: w.id, ...w.layout }));

  return (
    <div className="bg-bg flex h-screen flex-col">
      <div className="border-border bg-surface flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-text-primary text-lg font-semibold">{dashboardName}</h1>
          {saveState !== 'idle' && (
            <span className="text-text-muted text-xs">
              {saveState === 'saving' ? 'Saving…' : 'Saved'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/dashboards/${dashboardId}`)}
            className="border-border text-text-primary hover:bg-surface rounded-[var(--radius-sm)] border px-3 py-1.5 text-sm font-medium"
          >
            View
          </button>
          <button
            type="button"
            onClick={() => setPanelOpen((open) => !open)}
            className="border-border text-text-primary hover:bg-surface rounded-[var(--radius-sm)] border px-3 py-1.5 text-sm font-medium"
          >
            + Add widget
          </button>
          <button
            type="button"
            onClick={handlePublishToggle}
            disabled={publishing}
            className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-semibold transition-colors ${
              published ? 'bg-success text-white' : 'bg-primary hover:bg-primary-hover text-white'
            } disabled:opacity-60`}
          >
            {published ? 'Published' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          {widgets.length === 0 ? (
            <div className="border-border text-text-muted flex h-full items-center justify-center rounded-[var(--radius-md)] border border-dashed text-sm">
              No widgets yet — click &quot;+ Add widget&quot; to start.
            </div>
          ) : (
            <ResponsiveGridLayout
              className="layout"
              layout={gridLayout}
              cols={12}
              rowHeight={40}
              margin={[12, 12]}
              draggableHandle=".widget-drag-handle"
              onDragStop={(layout) => void handleLayoutChange(layout)}
              onResizeStop={(layout) => void handleLayoutChange(layout)}
            >
              {widgets.map((widget) => (
                <div key={widget.id}>
                  <WidgetRenderer
                    dashboardId={dashboardId}
                    widgetId={widget.id}
                    widgetType={widget.widget_type}
                    title={widget.title}
                    onRemove={() => void handleRemoveWidget(widget.id)}
                  />
                </div>
              ))}
            </ResponsiveGridLayout>
          )}
        </div>

        {panelOpen && (
          <div className="w-80">
            <AddWidgetPanel onAdd={handleAddWidget} onClose={() => setPanelOpen(false)} />
          </div>
        )}
      </div>
    </div>
  );
}
