import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

import { WidgetRenderer } from '@/components/dashboard/WidgetRenderer';
import { getCurrentOrgMembership, roleSatisfies } from '@/lib/auth/current-org';
import type { WidgetType } from '@/components/widgets/types';
import { createClient } from '@/lib/supabase/server';

export const instant = false;

export default async function DashboardViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // RLS already enforces that a viewer-role user can only ever select a
  // published dashboard here — an unpublished one simply doesn't come
  // back, which is why this is a 404, not a 403: the hard permission
  // boundary is "it doesn't exist for you" (docs/UX.md §3.4/§3.5).
  const { data: dashboard } = await supabase
    .from('dashboards')
    .select('id, name, is_published')
    .eq('id', id)
    .single();

  if (!dashboard) {
    notFound();
  }

  const { data: widgets } = await supabase
    .from('dashboard_widgets')
    .select('id, widget_type, title, layout')
    .eq('dashboard_id', id)
    .order('created_at');

  const membership = await getCurrentOrgMembership();
  const canEdit = membership ? roleSatisfies(membership.role, 'editor') : false;

  return (
    <div className="bg-bg min-h-screen">
      <header className="border-border bg-surface flex h-12 items-center justify-between border-b px-6">
        <h1 className="text-text-primary text-sm font-medium">{dashboard.name}</h1>
        {canEdit && (
          <Link
            href={`/dashboards/${dashboard.id}/edit`}
            className="text-primary hover:text-primary-hover text-sm"
          >
            Edit
          </Link>
        )}
      </header>

      <div className="p-6">
        {!widgets || widgets.length === 0 ? (
          <div className="border-border text-text-muted rounded-[var(--radius-md)] border border-dashed p-12 text-center text-sm">
            This dashboard has no widgets yet.
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-3">
            {widgets.map((widget) => {
              const layout = widget.layout as { x: number; y: number; w: number; h: number };
              return (
                <div
                  key={widget.id}
                  style={{
                    gridColumn: `span ${layout.w} / span ${layout.w}`,
                    minHeight: layout.h * 40,
                  }}
                >
                  <WidgetRenderer
                    dashboardId={dashboard.id}
                    widgetId={widget.id}
                    widgetType={widget.widget_type as WidgetType}
                    title={widget.title}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
