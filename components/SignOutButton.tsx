'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="border-border text-text-secondary hover:text-text-primary rounded-[var(--radius-sm)] border px-3 py-1.5 text-sm transition-colors disabled:opacity-60"
    >
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
