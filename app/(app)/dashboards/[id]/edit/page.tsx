import { notFound, redirect } from 'next/navigation';

import { DashboardDesigner } from '@/components/dashboard/DashboardDesigner';
import type { WidgetType } from '@/components/widgets/types';
import { createClient } from '@/lib/supabase/server';

export const instant = false;

export default async function DashboardEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

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

  return (
    <DashboardDesigner
      dashboardId={dashboard.id}
      dashboardName={dashboard.name}
      isPublished={dashboard.is_published}
      initialWidgets={(widgets ?? []).map((w) => ({
        id: w.id,
        widget_type: w.widget_type as WidgetType,
        title: w.title,
        layout: w.layout as { x: number; y: number; w: number; h: number },
      }))}
    />
  );
}
