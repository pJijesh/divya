'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { loginSchema } from '@/lib/validation/schemas';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push('/dashboards');
    router.refresh();
  }

  return (
    <main className="bg-bg flex min-h-screen items-center justify-center px-4">
      <div className="border-border bg-surface-raised w-full max-w-[400px] rounded-[var(--radius-md)] border p-8">
        <h1 className="text-text-primary mb-6 text-xl font-semibold">Log in to Divya</h1>

        {error && (
          <div className="border-danger/30 bg-danger/10 text-danger mb-4 rounded-[var(--radius-sm)] border px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="password" className="text-text-primary block text-sm font-medium">
                Password
              </label>
              <span className="text-text-secondary text-sm">Forgot password?</span>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="border-border bg-bg text-text-primary focus:border-primary focus:ring-focus-ring w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary-hover w-full rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-text-secondary mt-6 text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary hover:text-primary-hover">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
