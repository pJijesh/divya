'use client';

import Link from 'next/link';
import { useState } from 'react';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
];

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-border/70 bg-bg/80 sticky top-0 z-20 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-text-primary text-lg font-bold tracking-tight">Divya</span>
          <span className="text-text-muted hidden text-xs sm:inline">
            Data Insight &amp; Visualisation Yielding Analytics
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="bg-primary hover:bg-primary-hover rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            Request early access
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="border-border text-text-primary flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border md:hidden"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <span aria-hidden>{mobileOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {mobileOpen && (
        <div className="border-border bg-bg border-t px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-text-secondary text-sm"
              >
                {link.label}
              </a>
            ))}
            <div className="border-border mt-2 flex flex-col gap-3 border-t pt-4">
              <Link href="/login" className="text-text-primary text-sm font-medium">
                Log in
              </Link>
              <Link
                href="/signup"
                className="bg-primary rounded-[var(--radius-sm)] px-4 py-2 text-center text-sm font-semibold text-white"
              >
                Request early access
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
