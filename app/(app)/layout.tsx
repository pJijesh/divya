import { QueryProvider } from '@/components/providers/QueryProvider';

// Wraps only the authenticated app routes (dashboards/datasets/data
// sources/widgets) — deliberately NOT the root layout, since QueryClient's
// constructor calls Date.now() internally, which would break static
// prerendering of the public marketing page if it ran there (see the
// Next.js cacheComponents error this route group was introduced to fix).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
