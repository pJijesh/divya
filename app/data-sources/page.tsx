import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AppHeader } from '@/components/AppHeader';
import { getCurrentOrgName } from '@/lib/auth/current-org';
import { createClient } from '@/lib/supabase/server';

export const instant = false;

const STATUS_STYLES: Record<string, string> = {
  connected: 'bg-success',
  pending: 'bg-warning',
  error: 'bg-danger',
};

export default async function DataSourcesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: dataSources } = await supabase
    .from('data_sources')
    .select('id, name, type, status, last_tested_at')
    .order('created_at', { ascending: false });

  const orgName = await getCurrentOrgName();

  return (
    <main className="bg-bg min-h-screen">
      <AppHeader orgName={orgName ?? ''} />
      <div className="mx-auto max-w-[1280px] px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-text-primary text-xl font-semibold">Data Sources</h1>
            <p className="text-text-secondary mt-1 text-sm">
              Connect a database so datasets can query it.
            </p>
          </div>
          <Link
            href="/data-sources/new"
            className="bg-primary hover:bg-primary-hover rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            New data source
          </Link>
        </div>

        {!dataSources || dataSources.length === 0 ? (
          <div className="border-border rounded-[var(--radius-md)] border border-dashed p-12 text-center">
            <p className="text-text-secondary">No data sources yet.</p>
            <Link
              href="/data-sources/new"
              className="text-primary hover:text-primary-hover mt-3 inline-block text-sm"
            >
              Connect your first data source
            </Link>
          </div>
        ) : (
          <div className="border-border bg-surface-raised overflow-hidden rounded-[var(--radius-md)] border">
            <table className="w-full text-sm">
              <thead className="border-border bg-surface text-text-secondary border-b text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Last tested</th>
                </tr>
              </thead>
              <tbody>
                {dataSources.map((ds) => (
                  <tr key={ds.id} className="border-border border-b last:border-0">
                    <td className="text-text-primary px-4 py-3">{ds.name}</td>
                    <td className="text-text-secondary px-4 py-3">{ds.type}</td>
                    <td className="px-4 py-3">
                      <span className="text-text-secondary inline-flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${STATUS_STYLES[ds.status] ?? 'bg-text-muted'}`}
                        />
                        {ds.status}
                      </span>
                    </td>
                    <td className="text-text-secondary px-4 py-3">
                      {ds.last_tested_at ? new Date(ds.last_tested_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
