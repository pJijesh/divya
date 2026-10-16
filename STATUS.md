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
- [x] `docs/UI.md` — visual/design system spec
- [x] `docs/UX.md` — flows, personas, interaction rules
- [x] `docs/API.md`, `docs/EMBED.md` — stubs, to be filled in Phase 4 / Phase 2 respectively
- [x] `CHANGELOG.md` — stub, Keep a Changelog format
- [x] Local build/lint/typecheck/format/test all pass

## In progress

- [ ] Vercel project — connecting next

## Not started (rest of Phase 1, in order)

- [ ] Data source connections + Postgres connector (Vault-backed credentials)
- [ ] Dataset + semantic layer v1 CRUD (`datasets`, `dataset_fields`, `metrics`, `dimensions`) + query-compiler
- [ ] Chart/widget engine (ECharts + TanStack Table, 8–12 widget types)
- [ ] Dashboard designer (react-grid-layout canvas)
- [ ] Dashboard viewer + filters
- [ ] Deployment/pipeline hardening (secret audit once Vercel env vars are set; re-run Supabase advisors after each future migration)

## Open decisions

- **GitHub CLI**: not installed locally; repo was pre-created manually and pushed to via `git remote` + token-less HTTPS. Fine for now; revisit if automated repo/PR management is needed later.
- **`SUPABASE_SERVICE_ROLE_KEY`**: not yet fetched/stored anywhere — needed when the signup→org-provisioning Route Handler is built (first consumer of `lib/supabase/admin.ts`).

## Roadmap beyond Phase 1

See the plan file for full detail. Phases 2–6: Embedding SDK → Connector expansion → AI layer → Collaboration/export → Enterprise hardening (SSO, audit, self-host).
