'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Recovery path for the rare case where organization/membership
// provisioning failed after the auth.users row was created (see
// docs/UX.md §3.1 "signup org-creation failure"). A user with zero
// memberships lands here instead of a broken empty dashboards page.
export function ProvisionRetry() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRetry() {
    setLoading(true);
    setError(null);

    const response = await fetch('/api/auth/provision-org', { method: 'POST' });
    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: 'Something went wrong' }));
      setError(body.error ?? 'Could not set up your organization');
      return;
    }

    router.refresh();
  }

  return (
    <main className="bg-bg flex min-h-screen items-center justify-center px-4">
      <div className="border-border bg-surface-raised w-full max-w-[400px] rounded-[var(--radius-md)] border p-8 text-center">
        <h1 className="text-text-primary mb-2 text-xl font-semibold">Set up your organization</h1>
        <p className="text-text-secondary mb-6 text-sm">
          Your account was created, but we couldn&apos;t finish setting up your organization. This
          is a one-time retry.
        </p>

        {error && (
          <div className="border-danger/30 bg-danger/10 text-danger mb-4 rounded-[var(--radius-sm)] border px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleRetry}
          disabled={loading}
          className="bg-primary hover:bg-primary-hover w-full rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60"
        >
          {loading ? 'Setting up…' : 'Try again'}
        </button>
      </div>
    </main>
  );
}
