import Link from 'next/link';

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="border-border bg-surface-raised relative overflow-hidden rounded-[var(--radius-lg)] border px-8 py-16 text-center sm:px-16">
        <div
          aria-hidden
          className="bg-[radial-gradient(ellipse_50%_80%_at_50%_100%,theme(colors.primary/15%),transparent)] pointer-events-none absolute inset-0 -z-10"
        />

        <h2 className="text-text-primary text-3xl font-semibold tracking-tight sm:text-4xl">
          Be one of the first teams on Divya
        </h2>
        <p className="text-text-secondary mx-auto mt-4 max-w-xl">
          We&apos;re building this in the open, in public. Sign up now and you&apos;ll be building
          dashboards alongside us as each phase ships.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="bg-primary hover:bg-primary-hover rounded-[var(--radius-sm)] px-6 py-3 text-sm font-semibold text-white transition-colors"
          >
            Request early access
          </Link>
          <Link
            href="/login"
            className="border-border text-text-primary hover:bg-surface rounded-[var(--radius-sm)] border px-6 py-3 text-sm font-semibold transition-colors"
          >
            Log in
          </Link>
        </div>
      </div>
    </section>
  );
}
