import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-border border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <span className="text-text-primary text-sm font-bold">Divya</span>
          <p className="text-text-muted mt-1 text-xs">
            Data Insight &amp; Visualisation Yielding Analytics
          </p>
        </div>

        <nav className="text-text-secondary flex items-center gap-6 text-sm">
          <a href="#features" className="hover:text-text-primary">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-text-primary">
            How it works
          </a>
          <Link href="/login" className="hover:text-text-primary">
            Log in
          </Link>
          <Link href="/signup" className="hover:text-text-primary">
            Sign up
          </Link>
        </nav>

        {/* Static on purpose — keeps the landing page fully prerenderable
            instead of pulling in a dynamic data access for a copyright year. */}
        <p className="text-text-muted text-xs">&copy; 2026 Divya. All rights reserved.</p>
      </div>
    </footer>
  );
}
