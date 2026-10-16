import Link from 'next/link';

import { SignOutButton } from '@/components/SignOutButton';

const NAV_LINKS = [
  { href: '/dashboards', label: 'Dashboards' },
  { href: '/datasets', label: 'Datasets' },
  { href: '/data-sources', label: 'Data Sources' },
];

// Minimal shared app-shell header. UI.md §3.1 specifies a full sidebar —
// this is the Phase 1 stand-in (just enough nav to reach every page built
// so far) until the dashboard designer work builds the real shell.
export function AppHeader({ orgName }: { orgName: string }) {
  return (
    <header className="border-border bg-surface flex h-14 items-center justify-between border-b px-6">
      <div className="flex items-center gap-6">
        <span className="text-text-primary text-sm font-semibold">{orgName}</span>
        <nav className="flex items-center gap-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <SignOutButton />
    </header>
  );
}
