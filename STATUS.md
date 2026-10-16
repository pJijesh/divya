# Divya — Project Status

_Last updated: 2026-10-16_

Living snapshot of where the build actually is. See the [plan](../../.claude/plans/polished-floating-quail.md) for the full phased roadmap and architecture detail; this file tracks real progress against it.

## Current phase

**Phase 1 — MVP** (in progress)

## Done

- [x] Repo scaffolded: Next.js 16 (App Router, TypeScript, Tailwind, ESLint), pushed to [github.com/pJijesh/divya](https://github.com/pJijesh/divya)
- [x] Supabase project created (`divya`, region `us-east-1`, org `pjijesh-outlookcom's projects`) — free tier
- [x] Core client libs installed: `@supabase/supabase-js`, `@supabase/ssr`, `zod`
- [x] `docs/UI.md` — visual/design system spec
- [x] `docs/UX.md` — flows, personas, interaction rules
- [x] `docs/API.md`, `docs/EMBED.md` — stubs, to be filled in Phase 4 / Phase 2 respectively
- [x] `CHANGELOG.md` — stub, Keep a Changelog format

## In progress

- [ ] `.env.example`, `.nvmrc`, `.prettierrc` — project infra files
- [ ] Supabase CLI scaffold (`supabase/config.toml`, `supabase/migrations/`)
- [ ] `.github/workflows/ci.yml` — lint/typecheck/test/migration-lint on PR

## Not started (rest of Phase 1, in order)

- [ ] Auth & multi-tenant schema + RLS (`organizations`, `memberships`, `profiles`)
- [ ] Data source connections + Postgres connector (Vault-backed credentials)
- [ ] Dataset + semantic layer v1 CRUD (`datasets`, `dataset_fields`, `metrics`, `dimensions`) + query-compiler
- [ ] Chart/widget engine (ECharts + TanStack Table, 8–12 widget types)
- [ ] Dashboard designer (react-grid-layout canvas)
- [ ] Dashboard viewer + filters
- [ ] Vercel deployment connected + first end-to-end deploy
- [ ] Deployment/pipeline hardening (Supabase advisors, secret audit, `/api/health`)

## Open decisions

- **LICENSE**: leaning toward none (defaults to all-rights-reserved) unless an explicit proprietary notice is wanted — awaiting confirmation.
- **GitHub CLI**: not installed locally; repo was pre-created manually and pushed to via `git remote` + token-less HTTPS. Fine for now; revisit if automated repo/PR management is needed later.

## Roadmap beyond Phase 1

See the plan file for full detail. Phases 2–6: Embedding SDK → Connector expansion → AI layer → Collaboration/export → Enterprise hardening (SSO, audit, self-host).
