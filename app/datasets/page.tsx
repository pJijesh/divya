import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AppHeader } from '@/components/AppHeader';
import { getCurrentOrgName } from '@/lib/auth/current-org';
import { createClient } from '@/lib/supabase/server';

export const instant = false;

export default async function DatasetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: datasets } = await supabase
    .from('datasets')
    .select(
      'id, name, source_type, updated_at, data_sources(name), metrics(count), dimensions(count)',
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  const { data: dataSources } = await supabase
    .from('data_sources')
    .select('id')
    .eq('status', 'connected')
    .limit(1);

  const hasConnectedDataSource = (dataSources?.length ?? 0) > 0;
  const orgName = await getCurrentOrgName();

  return (
    <main className="bg-bg min-h-screen">
      <AppHeader orgName={orgName ?? ''} />
      <div className="mx-auto max-w-[1280px] px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-text-primary text-xl font-semibold">Datasets</h1>
            <p className="text-text-secondary mt-1 text-sm">
              Define metrics and dimensions on top of a data source.
            </p>
          </div>
          {hasConnectedDataSource ? (
            <Link
              href="/datasets/new"
              className="bg-primary hover:bg-primary-hover rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold text-white transition-colors"
            >
              New dataset
            </Link>
          ) : null}
        </div>

        {!datasets || datasets.length === 0 ? (
          <div className="border-border rounded-[var(--radius-md)] border border-dashed p-12 text-center">
            <p className="text-text-secondary">No datasets yet.</p>
            {hasConnectedDataSource ? (
              <Link
                href="/datasets/new"
                className="text-primary hover:text-primary-hover mt-3 inline-block text-sm"
              >
                Create your first dataset
              </Link>
            ) : (
              <Link
                href="/data-sources"
                className="text-primary hover:text-primary-hover mt-3 inline-block text-sm"
              >
                Connect a data source first
              </Link>
            )}
          </div>
        ) : (
          <div className="border-border bg-surface-raised overflow-hidden rounded-[var(--radius-md)] border">
            <table className="w-full text-sm">
              <thead className="border-border bg-surface text-text-secondary border-b text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Data source</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Metrics</th>
                  <th className="px-4 py-3 font-medium">Dimensions</th>
                  <th className="px-4 py-3 font-medium">Last updated</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((ds) => (
                  <tr key={ds.id} className="border-border hover:bg-surface border-b last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/datasets/${ds.id}`}
                        className="text-primary hover:text-primary-hover font-medium"
                      >
                        {ds.name}
                      </Link>
                    </td>
                    <td className="text-text-secondary px-4 py-3">
                      {ds.data_sources?.name ?? '—'}
                    </td>
                    <td className="text-text-secondary px-4 py-3">{ds.source_type}</td>
                    <td className="text-text-secondary px-4 py-3">{ds.metrics?.[0]?.count ?? 0}</td>
                    <td className="text-text-secondary px-4 py-3">
                      {ds.dimensions?.[0]?.count ?? 0}
                    </td>
                    <td className="text-text-secondary px-4 py-3">
                      {new Date(ds.updated_at).toLocaleString()}
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
