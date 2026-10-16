import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,theme(colors.primary/18%),transparent)] pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[480px]"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:py-32">
        <div>
          <span className="border-border bg-surface text-text-secondary inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
            <span className="bg-primary h-1.5 w-1.5 rounded-full" />
            Now building · Early access
          </span>

          <h1 className="text-text-primary mt-6 text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Embedded analytics, built for your product — not bolted onto it.
          </h1>

          <p className="text-text-secondary mt-6 max-w-xl text-lg">
            Divya is a from-the-ground-up alternative to legacy BI suites: a self-service analytics
            platform designed from day one to live inside your own product, with a governed semantic
            layer and multi-tenant security as the foundation, not an afterthought.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="bg-primary hover:bg-primary-hover rounded-[var(--radius-sm)] px-6 py-3 text-center text-sm font-semibold text-white transition-colors"
            >
              Request early access
            </Link>
            <Link
              href="/login"
              className="border-border text-text-primary hover:bg-surface rounded-[var(--radius-sm)] border px-6 py-3 text-center text-sm font-semibold transition-colors"
            >
              Log in
            </Link>
          </div>

          <p className="text-text-muted mt-4 text-xs">
            No credit card. We&apos;re building this in the open — expect rough edges.
          </p>
        </div>

        <DashboardMock />
      </div>
    </section>
  );
}

// An illustrative, abstract mock of a dashboard — not a screenshot of a
// shipped feature. The dashboard designer/viewer doesn't exist yet; this
// is deliberately geometric rather than presented as a real product shot.
function DashboardMock() {
  return (
    <div className="relative">
      <div className="border-border bg-surface-raised rounded-[var(--radius-lg)] border p-4 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.25)] sm:p-6">
        <div className="mb-4 flex items-center gap-1.5">
          <span className="bg-danger/60 h-2.5 w-2.5 rounded-full" />
          <span className="bg-warning/60 h-2.5 w-2.5 rounded-full" />
          <span className="bg-success/60 h-2.5 w-2.5 rounded-full" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="border-border bg-surface col-span-1 rounded-[var(--radius-md)] border p-3">
            <div className="bg-text-muted/30 h-2 w-10 rounded" />
            <div className="text-text-primary mt-3 text-xl font-semibold">24.8k</div>
            <div className="bg-success/20 mt-1 h-1.5 w-full rounded">
              <div className="bg-success h-1.5 w-2/3 rounded" />
            </div>
          </div>
          <div className="border-border bg-surface col-span-1 rounded-[var(--radius-md)] border p-3">
            <div className="bg-text-muted/30 h-2 w-10 rounded" />
            <div className="text-text-primary mt-3 text-xl font-semibold">$91.2k</div>
            <div className="bg-primary/20 mt-1 h-1.5 w-full rounded">
              <div className="bg-primary h-1.5 w-4/5 rounded" />
            </div>
          </div>
          <div className="border-border bg-surface col-span-1 rounded-[var(--radius-md)] border p-3">
            <div className="bg-text-muted/30 h-2 w-10 rounded" />
            <div className="text-text-primary mt-3 text-xl font-semibold">3.2%</div>
            <div className="bg-warning/20 mt-1 h-1.5 w-full rounded">
              <div className="bg-warning h-1.5 w-1/3 rounded" />
            </div>
          </div>

          <div className="border-border bg-surface col-span-2 rounded-[var(--radius-md)] border p-4">
            <div className="bg-text-muted/30 mb-3 h-2 w-20 rounded" />
            <div className="flex h-24 items-end gap-2">
              {[40, 65, 50, 80, 60, 95, 70].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className="bg-primary/70 flex-1 rounded-t"
                />
              ))}
            </div>
          </div>

          <div className="border-border bg-surface col-span-1 flex items-center justify-center rounded-[var(--radius-md)] border p-4">
            <div
              className="h-20 w-20 rounded-full"
              style={{
                background:
                  'conic-gradient(var(--color-primary) 0% 45%, var(--color-success) 45% 70%, var(--color-warning) 70% 100%)',
              }}
            />
          </div>
        </div>
      </div>

      <div className="border-border bg-surface-raised absolute -bottom-6 -left-6 hidden rounded-[var(--radius-md)] border p-3 shadow-lg sm:block">
        <div className="text-text-secondary flex items-center gap-2 text-xs font-medium">
          <span className="bg-success h-2 w-2 rounded-full" />
          Live query · 180ms
        </div>
      </div>
    </div>
  );
}
