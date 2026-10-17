'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function NewDashboardButton() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    setCreating(true);
    const response = await fetch('/api/dashboards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Untitled dashboard' }),
    });
    const body = await response.json();
    setCreating(false);

    if (response.ok) {
      router.push(`/dashboards/${body.id}/edit`);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCreate}
      disabled={creating}
      className="rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
    >
      {creating ? 'Creating…' : 'New dashboard'}
    </button>
  );
}
