# Divya — Project Status

_Last updated: 2026-10-16_

Living snapshot of where the build actually is. See the [plan](../../.claude/plans/polished-floating-quail.md) for the full phased roadmap and architecture detail; this file tracks real progress against it.

## Current phase

**Phase 1 — MVP** (core feature set complete; hardening/polish remains)

## Done

- [x] Repo scaffolded: Next.js 16 (App Router, TypeScript, Tailwind, ESLint), pushed to [github.com/pJijesh/divya](https://github.com/pJijesh/divya)
- [x] Supabase project created (`divya`, region `us-east-1`, org `pjijesh-outlookcom's projects`) — free tier
- [x] Core client libs installed: `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `vitest`, `prettier`
- [x] Tenancy/RLS migration applied live (`organizations`, `memberships`, `profiles`) + two follow-up migrations hardening internal functions and optimizing RLS per the Supabase security/performance advisors — both advisors now clean (only an expected INFO-level "unused index" note, no data yet)
- [x] `types/database.types.ts` generated from the live schema
- [x] Supabase client layering (`lib/supabase/{client,server,admin}.ts`) + session-refresh `proxy.ts` (migrated from `middleware.ts` per the Next.js 16 convention via official codemod)
- [x] `/api/health` route
- [x] `.env.example`, `.env.local`, `.nvmrc`, `.prettierrc`, `LICENSE` (proprietary, all-rights-reserved)
- [x] `supabase/config.toml`, `supabase/migrations/`, `supabase/seed.sql`
- [x] `.github/workflows/ci.yml` (lint/typecheck/format/test + migration-lint) and `deploy-migrations.yml` (production migrations on merge to `main`)
- [x] `docs/UI.md`, `docs/UX.md`, `docs/TESTING.md` — specs/strategy
- [x] `docs/API.md`, `docs/EMBED.md` — stubs, to be filled in Phase 4 / Phase 2 respectively
- [x] `CHANGELOG.md` — stub, Keep a Changelog format
- [x] Vercel project `divya` connected to GitHub (auto-deploys on push to `main`), env vars set, confirmed live at [divya-drab.vercel.app](https://divya-drab.vercel.app) — `/api/health` returns `{"status":"ok"}`
- [x] Design tokens from `docs/UI.md` wired into `app/globals.css` (Tailwind v4 `@theme`)
- [x] Auth flow: `/login`, `/signup` pages, `/api/auth/provision-org` (idempotent org + admin-membership provisioning), `/auth/callback` (email-confirmation PKCE exchange), `/dashboards` stub with a `ProvisionRetry` recovery path
- [x] Local build/lint/typecheck/format/test all pass; production build passes (fixed a Next.js 16 `cacheComponents` prerender error on `/dashboards`)
- [x] `SUPABASE_SERVICE_ROLE_KEY` set in `.env.local` and Vercel (Secret type, all environments), verified valid against the Supabase Admin API
- [x] **Full auth flow verified live in production** (signup → email confirmation → login → org provisioning → authenticated `/dashboards`), using a real Mailinator test account, then cleaned up. Found and fixed a real bug along the way: Supabase's Redirect URLs allowlist didn't include the Vercel domain, so confirmation emails silently fell back to `localhost:3000` — added `https://divya-drab.vercel.app/auth/callback` and set Site URL to the production domain. Also observed the `ProvisionRetry` recovery path trigger for real (a concurrent Supabase Auth rate-limit response interfered with the post-login redirect) and confirmed it correctly recovers.
- [x] Public marketing landing page at `/` (Nav, Hero, Features, HowItWorks, FinalCta, Footer) — live at [divya-drab.vercel.app](https://divya-drab.vercel.app). Copy is deliberately honest about project stage ("Now building · Early access") rather than overclaiming unshipped features or using fabricated social proof/testimonials. Verified responsive (mobile nav toggle) and fully statically prerendered.
- [x] Data source connections + Postgres connector: `data_sources` table (Vault-backed credentials, never plaintext), SSRF guard, read-only transaction + statement-timeout wrapping, table/column introspection, query execution — registry-based (`lib/connectors/`) so future connector types are additive. UI for add-with-test-then-save.
- [x] Semantic layer v1: `datasets`, `dataset_fields`, `metrics`, `dimensions` tables (RLS, `organization_id` denormalized everywhere). `lib/semantic/query-compiler.ts` translates `{dataset, metrics, dimensions, filters}` into one parameterized SQL statement — 14 passing unit tests (aggregations, time-grain grouping, every filter operator, injection attempts). Full CRUD UI: dataset list, create flow (table or query source, with preview-before-save), detail page with Source/Metrics & Dimensions tabs and schema-drift-aware refresh.
- [x] Chart/widget engine: all 8 Phase-1 widget types (bar/line/area/pie/scatter/kpi/table/pivot_table) via ECharts (modular import) + TanStack Table v8, a shared widget registry and card chrome, TanStack Query wired into the root layout, and `/api/widgets/preview` + `/widgets/preview` to exercise widgets against real data before the dashboard designer exists.
- [x] **CI fixed**: `tsc --noEmit` alone passed locally (stale `.next/types`) but failed in GitHub Actions' clean checkout, since Next.js 16's typed routes need `next typegen` run first. `typecheck` now runs `next typegen && tsc --noEmit`; confirmed green on CI.
- [x] Moved the authenticated routes (`dashboards`, `datasets`, `data-sources`, `widgets`) into an `app/(app)/` route group with its own layout holding `QueryProvider`, instead of the root layout — `QueryClient`'s constructor calls `Date.now()` internally, which was breaking static prerendering of the public landing page when the provider lived at the root. `/` is confirmed still fully static after the move. Separately found that `/dashboards` logs a `Date.now()` prerender diagnostic in `next dev` only — production build is 100% clean for that route (correctly `ƒ` dynamic, zero errors) and the page works correctly; treating this as a `next dev`-mode Cache Components rough edge in this Next.js version, not a real bug, since it doesn't reproduce in `next build`.
- [x] **Dashboard designer + viewer** — `dashboards`/`dashboard_widgets`/`dashboard_filters` tables (RLS: viewer-role users can only ever select a _published_ dashboard — a draft genuinely doesn't exist for them, enforced at the RLS layer, not just hidden in the UI). `lib/widgets/execute-widget-query.ts` factors out the compile-then-execute path shared by the ad-hoc preview route and the new persisted-widget data route. Designer: react-grid-layout canvas (drag by title bar only), an Add Widget panel, explicit Publish toggle (autosave only writes the draft). Viewer: read-only grid render, 404s a draft for non-editors. **Verified live in the browser**: create dashboard → designer renders → Add Widget panel shows all 8 types → View → viewer renders correctly, full round trip with a disposable test account, then cleaned up. Pinned `react-grid-layout` to 1.5.4 (v2 is a hooks-based rewrite with no `WidthProvider`, same situation as `@tanstack/react-table` v9 earlier).

This completes Phase 1's core feature set end-to-end: auth → data sources → datasets/semantic layer → widgets → dashboards (designer + viewer), all live and deployed.

## Not started / known gaps

- [ ] **Dashboard-level filters** — `dashboard_filters` table and RLS exist, but there's no filter-management UI or filter-to-widget data propagation yet. Deferred from this pass; the schema doesn't block adding it later.
- [ ] End-to-end click-through test of a dashboard **with real widget data** against a live external Postgres database — verified so far is the full UI flow (create/add-widget/publish/view) and the API/compiler logic (automated tests), but no test account has had an actual connected Postgres data source + dataset to render real chart data in the browser.
- [ ] Deployment/pipeline hardening (secret audit, re-run Supabase advisors after each future migration, index the handful of INFO-level unindexed `created_by` foreign keys if they ever show real traffic)
- [ ] Enable Supabase's "leaked password protection" (HaveIBeenPwned check) — flagged by the security advisor, a one-click dashboard setting, not yet turned on
- [ ] `deploy-migrations.yml` CI workflow still fails (see below) — not blocking since migrations are applied directly via the Supabase MCP tool, but the automation path itself has never been exercised

## Open decisions

- **GitHub CLI**: not installed locally; repo was pre-created manually and pushed to via `git remote` + token-less HTTPS. Fine for now; revisit if automated repo/PR management is needed later.
- **Supabase redirect-URL wildcard**: attempted to also allow `https://divya-*.vercel.app/auth/callback` (preview deployments) and `http://localhost:3000/auth/callback` (local dev) — only the exact production URL persisted; the other two didn't save for unclear reasons. Only blocks preview-deployment and local email-confirmation testing, not production. Revisit via the dashboard when needed.
- **Supabase free-tier email rate limit**: hit this during testing (a handful of auth emails per hour). Fine for development; will need a custom SMTP provider configured before real users sign up at any volume.
- **`deploy-migrations.yml` CI workflow fails on every push** — `SUPABASE_ACCESS_TOKEN`/`SUPABASE_PROJECT_REF` GitHub secrets were never set, since all migrations so far were applied directly to the live project via the Supabase MCP tool rather than through that pipeline. The schema itself is correct and live either way; this only means the CI automation path for migrations has never actually been exercised. Needs a Supabase personal access token added as a repo secret before it'll pass.

## Roadmap beyond Phase 1

See the plan file for full detail. Phases 2–6: Embedding SDK → Connector expansion → AI layer → Collaboration/export → Enterprise hardening (SSO, audit, self-host).
