import { Blocks, Code2, Gauge, Layers, ShieldCheck, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    icon: Layers,
    title: 'A real semantic layer',
    description:
      'Metrics and dimensions are defined once as structured data, not raw SQL — so dashboards, a future API, and natural-language querying all read from the same governed source of truth.',
  },
  {
    icon: Blocks,
    title: 'Embeddable by design',
    description:
      'A JS SDK and iframe embedding with guest tokens and tenant-scoped row-level security are on the architecture from the start, not retrofitted after the fact.',
  },
  {
    icon: ShieldCheck,
    title: 'Multi-tenant and secure by default',
    description:
      'Every query runs read-only, every table is row-level-secured per organization, every credential lives in Supabase Vault. That’s the baseline, not an upgrade.',
  },
  {
    icon: Gauge,
    title: 'Usage-based, not seat-locked',
    description:
      'Built on serverless infrastructure instead of per-server licensing, so cost can scale with usage instead of punishing you for growing.',
  },
  {
    icon: Sparkles,
    title: 'An AI-native roadmap',
    description:
      'Because the semantic layer is structured from day one, natural-language dashboard creation and automated insights are a later phase — not a rebuild.',
  },
  {
    icon: Code2,
    title: 'A modern, open stack',
    description:
      'Next.js, Supabase, and Vercel under the hood. Deployed continuously, not shipped in quarterly releases.',
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-text-primary text-3xl font-semibold tracking-tight sm:text-4xl">
          What we&apos;re building
        </h2>
        <p className="text-text-secondary mt-4">
          Divya is early, and we&apos;d rather tell you what it&apos;s designed to do than oversell
          what&apos;s already shipped.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="border-border bg-surface-raised rounded-[var(--radius-md)] border p-6"
          >
            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)]">
              <feature.icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <h3 className="text-text-primary mt-4 text-base font-semibold">{feature.title}</h3>
            <p className="text-text-secondary mt-2 text-sm">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
