'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { signupSchema } from '@/lib/validation/schemas';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = signupSchema.safeParse({ email, password, fullName, organizationName });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.fullName,
          pending_org_name: parsed.data.organizationName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    // A session means email confirmation is disabled for this project —
    // provision the org now. Otherwise app/auth/callback does it once the
    // user clicks the confirmation link.
    if (data.session) {
      const response = await fetch('/api/auth/provision-org', { method: 'POST' });
      setLoading(false);

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Something went wrong' }));
        setError(body.error ?? 'Could not set up your organization');
        return;
      }

      router.push('/dashboards');
      router.refresh();
      return;
    }

    setLoading(false);
    setAwaitingConfirmation(true);
  }

  if (awaitingConfirmation) {
    return (
      <main className="bg-bg flex min-h-screen items-center justify-center px-4">
        <div className="border-border bg-surface-raised w-full max-w-[400px] rounded-[var(--radius-md)] border p-8 text-center">
          <h1 className="text-text-primary mb-2 text-xl font-semibold">Check your email</h1>
          <p className="text-text-secondary text-sm">
            We sent a confirmation link to <span className="text-text-primary">{email}</span>. Click
            it to finish setting up your account and organization.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-bg flex min-h-screen items-center justify-center px-4">
      <div className="border-border bg-surface-raised w-full max-w-[400px] rounded-[var(--radius-md)] border p-8">
        <h1 className="text-text-primary mb-6 text-xl font-semibold">Create your Divya account</h1>

        {error && (
          <div className="border-danger/30 bg-danger/10 text-danger mb-4 rounded-[var(--radius-sm)] border px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="fullName" className="text-text-primary mb-1 block text-sm font-medium">
              Your name
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="border-border bg-bg text-text-primary focus:border-primary focus:ring-focus-ring w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="email" className="text-text-primary mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="border-border bg-bg text-text-primary focus:border-primary focus:ring-focus-ring w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-text-primary mb-1 block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="border-border bg-bg text-text-primary focus:border-primary focus:ring-focus-ring w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="organizationName"
              className="text-text-primary mb-1 block text-sm font-medium"
            >
              Organization name
            </label>
            <input
              id="organizationName"
              type="text"
              required
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
              className="border-border bg-bg text-text-primary focus:border-primary focus:ring-focus-ring w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary-hover w-full rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-text-secondary mt-6 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-primary-hover">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
