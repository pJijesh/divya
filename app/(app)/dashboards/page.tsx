import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AppHeader } from '@/components/AppHeader';
import { NewDashboardButton } from '@/components/dashboard/NewDashboardButton';
import { ProvisionRetry } from '@/components/ProvisionRetry';
import { createClient } from '@/lib/supabase/server';

// Always dynamic — reads the session cookie and per-user membership data,
// so it can never be prerendered (required under cacheComponents, see
// next.config.ts).
export const instant = false;

export default async function DashboardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: memberships } = await supabase
    .from('memberships')
    .select('role, organization:organizations(id, name)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1);

  const membership = memberships?.[0];

  if (!membership) {
    return <ProvisionRetry />;
  }

  const { data: dashboards } = await supabase
    .from('dashboards')
    .select('id, name, is_published, updated_at')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  const canEdit = membership.role === 'admin' || membership.role === 'editor';

  return (
    <main className="min-h-screen bg-bg">
      <AppHeader orgName={membership.organization?.name ?? ''} />

      <div className="mx-auto max-w-[1280px] px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-text-primary">Dashboards</h1>
          {canEdit && <NewDashboardButton />}
        </div>

        {!dashboards || dashboards.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-border p-12 text-center">
            <p className="text-text-secondary">No dashboards yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dashboards.map((dashboard) => (
              <Link
                key={dashboard.id}
                href={canEdit ? `/dashboards/${dashboard.id}/edit` : `/dashboards/${dashboard.id}`}
                className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-text-primary">{dashboard.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      dashboard.is_published
                        ? 'bg-success/10 text-success'
                        : 'bg-warning/10 text-warning'
                    }`}
                  >
                    {dashboard.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-text-muted">
                  Updated {new Date(dashboard.updated_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
