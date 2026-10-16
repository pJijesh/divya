'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

type DataSourceOption = { id: string; name: string };
type TableOption = { schema: string; name: string; columns: { name: string; dataType: string }[] };
type PreviewColumn = { name: string; dataType: string };

export default function NewDatasetPage() {
  const router = useRouter();

  const [dataSources, setDataSources] = useState<DataSourceOption[]>([]);
  const [dataSourceId, setDataSourceId] = useState('');
  const [sourceType, setSourceType] = useState<'table' | 'query'>('table');

  const [tables, setTables] = useState<TableOption[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [selectedTableKey, setSelectedTableKey] = useState('');

  const [sql, setSql] = useState('');
  const [previewColumns, setPreviewColumns] = useState<PreviewColumn[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('data_sources')
      .select('id, name')
      .eq('status', 'connected')
      .then(({ data }) => setDataSources(data ?? []));
  }, []);

  // Triggered from the data-source select's onChange and the "Table"
  // toggle's onClick (real user events) rather than a useEffect reacting
  // to their resulting state, so the loading-state setState calls happen
  // inside an async event handler, not synchronously in an effect body.
  async function loadTables(id: string) {
    setTablesLoading(true);
    setSelectedTableKey('');
    try {
      const response = await fetch(`/api/data-sources/${id}/tables`);
      const body = await response.json();
      setTables(body.tables ?? []);
    } catch {
      setTables([]);
    } finally {
      setTablesLoading(false);
    }
  }

  async function handlePreviewQuery() {
    if (!dataSourceId || !sql.trim()) return;
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewColumns(null);

    const response = await fetch(`/api/data-sources/${dataSourceId}/preview-query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql }),
    });
    const body = await response.json();
    setPreviewLoading(false);

    if (!response.ok) {
      setPreviewError(body.error ?? 'Query failed');
      return;
    }

    setPreviewColumns(body.columns);
  }

  const selectedTable = tables.find((t) => `${t.schema}.${t.name}` === selectedTableKey);
  const canSave =
    name.trim().length > 0 &&
    dataSourceId &&
    (sourceType === 'table' ? !!selectedTable : previewColumns !== null);

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setSaveError(null);

    const payload =
      sourceType === 'table'
        ? {
            sourceType: 'table' as const,
            dataSourceId,
            name,
            description: description || undefined,
            sourceTableSchema: selectedTable!.schema,
            sourceTableName: selectedTable!.name,
          }
        : {
            sourceType: 'query' as const,
            dataSourceId,
            name,
            description: description || undefined,
            sourceSql: sql,
          };

    const response = await fetch('/api/datasets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    setSaving(false);

    if (!response.ok) {
      setSaveError(body.error ?? 'Could not create dataset');
      return;
    }

    router.push(`/datasets/${body.id}`);
  }

  return (
    <main className="bg-bg min-h-screen">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="text-text-primary mb-6 text-xl font-semibold">New dataset</h1>

        <div className="space-y-5">
          <div>
            <label className="text-text-primary mb-1 block text-sm font-medium">Data source</label>
            <select
              value={dataSourceId}
              onChange={(e) => {
                const id = e.target.value;
                setDataSourceId(id);
                if (id && sourceType === 'table') {
                  void loadTables(id);
                } else {
                  setTables([]);
                }
              }}
              className="border-border bg-bg text-text-primary w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm"
            >
              <option value="">Select a data source…</option>
              {dataSources.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-text-primary mb-1 block text-sm font-medium">Source</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSourceType('table');
                  if (dataSourceId) void loadTables(dataSourceId);
                }}
                className={`flex-1 rounded-[var(--radius-sm)] border px-3 py-2 text-sm font-medium transition-colors ${
                  sourceType === 'table'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-text-secondary hover:bg-surface'
                }`}
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => setSourceType('query')}
                className={`flex-1 rounded-[var(--radius-sm)] border px-3 py-2 text-sm font-medium transition-colors ${
                  sourceType === 'query'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-text-secondary hover:bg-surface'
                }`}
              >
                Query
              </button>
            </div>
          </div>

          {sourceType === 'table' ? (
            <div>
              <label className="text-text-primary mb-1 block text-sm font-medium">Table</label>
              <select
                value={selectedTableKey}
                onChange={(e) => setSelectedTableKey(e.target.value)}
                disabled={!dataSourceId || tablesLoading}
                className="border-border bg-bg text-text-primary w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm disabled:opacity-60"
              >
                <option value="">{tablesLoading ? 'Loading tables…' : 'Select a table…'}</option>
                {tables.map((t) => (
                  <option key={`${t.schema}.${t.name}`} value={`${t.schema}.${t.name}`}>
                    {t.schema}.{t.name}
                  </option>
                ))}
              </select>

              {selectedTable && (
                <ul className="border-border bg-surface text-text-secondary mt-3 space-y-1 rounded-[var(--radius-sm)] border p-3 text-xs">
                  {selectedTable.columns.map((c) => (
                    <li key={c.name}>
                      {c.name} <span className="text-text-muted">· {c.dataType}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div>
              <label className="text-text-primary mb-1 block text-sm font-medium">SQL</label>
              <textarea
                value={sql}
                onChange={(e) => {
                  setSql(e.target.value);
                  setPreviewColumns(null);
                }}
                rows={6}
                disabled={!dataSourceId}
                placeholder="select * from orders where region = 'us'"
                className="border-border bg-bg text-text-primary w-full rounded-[var(--radius-sm)] border px-3 py-2 font-mono text-sm disabled:opacity-60"
              />
              <button
                type="button"
                onClick={handlePreviewQuery}
                disabled={!dataSourceId || !sql.trim() || previewLoading}
                className="border-border text-text-primary hover:bg-surface mt-2 rounded-[var(--radius-sm)] border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60"
              >
                {previewLoading ? 'Running…' : 'Run & preview'}
              </button>

              {previewError && <p className="text-danger mt-2 text-sm">{previewError}</p>}
              {previewColumns && (
                <ul className="border-border bg-surface text-text-secondary mt-3 space-y-1 rounded-[var(--radius-sm)] border p-3 text-xs">
                  {previewColumns.map((c) => (
                    <li key={c.name}>
                      {c.name} <span className="text-text-muted">· {c.dataType}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div>
            <label className="text-text-primary mb-1 block text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-border bg-bg text-text-primary w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-text-primary mb-1 block text-sm font-medium">
              Description (optional)
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-border bg-bg text-text-primary w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            className="bg-primary hover:bg-primary-hover rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60"
          >
            {saving ? 'Creating…' : 'Create dataset'}
          </button>
          {saveError && <p className="text-danger text-sm">{saveError}</p>}
        </div>
      </div>
    </main>
  );
}
