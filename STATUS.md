# Divya — Project Status

_Last updated: 2026-10-16_

Living snapshot of where the build actually is. See the [plan](../../.claude/plans/polished-floating-quail.md) for the full phased roadmap and architecture detail; this file tracks real progress against it.

## Current phase

**Phase 1 — MVP** (in progress)

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

## Not started (rest of Phase 1, in order)

- [ ] Dashboard designer (react-grid-layout canvas)
- [ ] Dashboard viewer + filters
- [ ] Deployment/pipeline hardening (secret audit, re-run Supabase advisors after each future migration)
- [ ] Manual click-through verification of the data-source/dataset/widget-preview UI against a real Postgres database (built and automated-tested, but not yet exercised by hand in the browser the way the auth flow was)

## Open decisions

- **GitHub CLI**: not installed locally; repo was pre-created manually and pushed to via `git remote` + token-less HTTPS. Fine for now; revisit if automated repo/PR management is needed later.
- **Supabase redirect-URL wildcard**: attempted to also allow `https://divya-*.vercel.app/auth/callback` (preview deployments) and `http://localhost:3000/auth/callback` (local dev) — only the exact production URL persisted; the other two didn't save for unclear reasons. Only blocks preview-deployment and local email-confirmation testing, not production. Revisit via the dashboard when needed.
- **Supabase free-tier email rate limit**: hit this during testing (a handful of auth emails per hour). Fine for development; will need a custom SMTP provider configured before real users sign up at any volume.
- **`deploy-migrations.yml` CI workflow fails on every push** — `SUPABASE_ACCESS_TOKEN`/`SUPABASE_PROJECT_REF` GitHub secrets were never set, since all migrations so far were applied directly to the live project via the Supabase MCP tool rather than through that pipeline. The schema itself is correct and live either way; this only means the CI automation path for migrations has never actually been exercised. Needs a Supabase personal access token added as a repo secret before it'll pass.

## Roadmap beyond Phase 1

See the plan file for full detail. Phases 2–6: Embedding SDK → Connector expansion → AI layer → Collaboration/export → Enterprise hardening (SSO, audit, self-host).
