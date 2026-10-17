import { AlertTriangle } from 'lucide-react';

// Shared chrome every widget type renders inside (docs/UI.md §5.1) — each
// widget component only implements its body; loading/error/empty states
// are handled once, here, not duplicated per widget. The header carries
// `widget-drag-handle` so the designer's grid can drag by title bar only
// (not the whole card, which would fight chart tooltip interaction) —
// see components/dashboard/DashboardDesigner.tsx's `draggableHandle`.
export function WidgetCard({
  title,
  onRemove,
  children,
}: {
  title?: string;
  onRemove?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border bg-surface-raised flex h-full flex-col rounded-[var(--radius-md)] border p-4">
      {(title || onRemove) && (
        <div className="widget-drag-handle mb-2 flex items-center justify-between">
          {title && <h3 className="text-text-primary text-sm font-semibold">{title}</h3>}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              onMouseDown={(e) => e.stopPropagation()}
              className="text-text-muted hover:text-danger text-xs"
            >
              Remove
            </button>
          )}
        </div>
      )}
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

export function WidgetLoading() {
  return (
    <div className="bg-surface h-full min-h-[120px] animate-pulse rounded-[var(--radius-sm)]" />
  );
}

export function WidgetError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 text-center">
      <AlertTriangle className="text-danger h-5 w-5" strokeWidth={1.75} />
      <p className="text-text-secondary text-sm">Couldn&apos;t load data</p>
      <p className="text-text-muted text-xs">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-primary hover:text-primary-hover text-xs"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function WidgetEmpty() {
  return (
    <div className="flex h-full min-h-[120px] items-center justify-center">
      <p className="text-text-muted text-sm">No data for this selection</p>
    </div>
  );
}
