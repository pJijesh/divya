'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { dataSourceConnectionSchema } from '@/lib/validation/schemas';

type TestState =
  | { status: 'idle' }
  | { status: 'testing' }
  | { status: 'success'; tableCount: number }
  | { status: 'error'; message: string };

export default function NewDataSourcePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('5432');
  const [databaseName, setDatabaseName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [sslMode, setSslMode] = useState<'require' | 'disable' | 'verify-full'>('require');
  const [testState, setTestState] = useState<TestState>({ status: 'idle' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fields = { name, host, port, databaseName, username, password, sslMode };

  function parseFields() {
    return dataSourceConnectionSchema.safeParse(fields);
  }

  async function handleTest() {
    const parsed = parseFields();
    if (!parsed.success) {
      setTestState({
        status: 'error',
        message: parsed.error.issues[0]?.message ?? 'Invalid input',
      });
      return;
    }

    setTestState({ status: 'testing' });

    const response = await fetch('/api/data-sources/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
    const body = await response.json();

    if (!response.ok || !body.ok) {
      setTestState({ status: 'error', message: body.error ?? 'Connection test failed' });
      return;
    }

    setTestState({ status: 'success', tableCount: body.tableCount ?? 0 });
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (testState.status !== 'success') return;

    const parsed = parseFields();
    if (!parsed.success) return;

    setSaving(true);
    setSaveError(null);

    const response = await fetch('/api/data-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
    const body = await response.json();
    setSaving(false);

    if (!response.ok) {
      setSaveError(body.error ?? 'Could not save data source');
      return;
    }

    router.push('/data-sources');
    router.refresh();
  }

  const fieldsDisabled = testState.status === 'testing';

  return (
    <main className="bg-bg min-h-screen">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="text-text-primary mb-6 text-xl font-semibold">Connect a data source</h1>

        <form onSubmit={handleSave} className="space-y-4" noValidate>
          <Field label="Name" value={name} onChange={setName} disabled={fieldsDisabled} />

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Field label="Host" value={host} onChange={setHost} disabled={fieldsDisabled} />
            </div>
            <Field label="Port" value={port} onChange={setPort} disabled={fieldsDisabled} />
          </div>

          <Field
            label="Database name"
            value={databaseName}
            onChange={setDatabaseName}
            disabled={fieldsDisabled}
          />
          <Field
            label="Username"
            value={username}
            onChange={setUsername}
            disabled={fieldsDisabled}
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            disabled={fieldsDisabled}
          />

          <div>
            <label className="text-text-primary mb-1 block text-sm font-medium">SSL mode</label>
            <select
              value={sslMode}
              onChange={(e) => setSslMode(e.target.value as typeof sslMode)}
              disabled={fieldsDisabled}
              className="border-border bg-bg text-text-primary w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm disabled:opacity-60"
            >
              <option value="require">Require</option>
              <option value="verify-full">Verify full</option>
              <option value="disable">Disable</option>
            </select>
          </div>

          <div className="border-border flex items-center gap-3 border-t pt-4">
            <button
              type="button"
              onClick={handleTest}
              disabled={fieldsDisabled}
              className="border-border text-text-primary hover:bg-surface rounded-[var(--radius-sm)] border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {testState.status === 'testing' ? 'Testing…' : 'Test connection'}
            </button>

            <button
              type="submit"
              disabled={testState.status !== 'success' || saving}
              className="bg-primary hover:bg-primary-hover rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>

          {testState.status === 'success' && (
            <p className="text-success text-sm">Connected — found {testState.tableCount} tables.</p>
          )}
          {testState.status === 'error' && (
            <p className="text-danger text-sm">{testState.message}</p>
          )}
          {saveError && <p className="text-danger text-sm">{saveError}</p>}
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="text-text-primary mb-1 block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="border-border bg-bg text-text-primary focus:border-primary focus:ring-focus-ring w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm focus:ring-2 focus:outline-none disabled:opacity-60"
      />
    </div>
  );
}
