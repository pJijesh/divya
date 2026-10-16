import { redirect } from 'next/navigation';

import { AppHeader } from '@/components/AppHeader';
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

  return (
    <main className="bg-bg min-h-screen">
      <AppHeader orgName={membership.organization?.name ?? ''} />

      <div className="mx-auto max-w-[1280px] px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-text-primary text-xl font-semibold">Dashboards</h1>
        </div>

        <div className="border-border rounded-[var(--radius-md)] border border-dashed p-12 text-center">
          <p className="text-text-secondary">No dashboards yet.</p>
          <p className="text-text-muted mt-1 text-sm">
            The dashboard designer isn&apos;t built yet — connect a data source next, once that page
            exists.
          </p>
        </div>
      </div>
    </main>
  );
}
