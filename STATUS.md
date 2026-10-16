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

## In progress

- [ ] **Blocked**: `SUPABASE_SERVICE_ROLE_KEY` not yet in `.env.local` or Vercel — the auto-reveal was blocked by a safety guardrail (credential materialization), so this needs the user to copy it from the Supabase dashboard themselves. Nothing that uses `lib/supabase/admin.ts` (i.e. the signup → org-provisioning flow) can be tested end-to-end until it's set in both places.

## Not started (rest of Phase 1, in order)

- [ ] Data source connections + Postgres connector (Vault-backed credentials)
- [ ] Dataset + semantic layer v1 CRUD (`datasets`, `dataset_fields`, `metrics`, `dimensions`) + query-compiler
- [ ] Chart/widget engine (ECharts + TanStack Table, 8–12 widget types)
- [ ] Dashboard designer (react-grid-layout canvas)
- [ ] Dashboard viewer + filters
- [ ] Deployment/pipeline hardening (secret audit, re-run Supabase advisors after each future migration)

## Open decisions

- **GitHub CLI**: not installed locally; repo was pre-created manually and pushed to via `git remote` + token-less HTTPS. Fine for now; revisit if automated repo/PR management is needed later.
- **Email confirmation**: Supabase project defaults to requiring email confirmation on signup, so `/auth/callback` exists to handle it — not yet verified end-to-end (needs a real signup attempt, which needs the service-role key first to test provisioning).

## Roadmap beyond Phase 1

See the plan file for full detail. Phases 2–6: Embedding SDK → Connector expansion → AI layer → Collaboration/export → Enterprise hardening (SSO, audit, self-host).
