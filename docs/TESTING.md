# Divya — Testing Strategy

How Divya is tested, what's covered today, and what's deliberately deferred. Mirrors the Verification Plan in the approved Phase 1 plan, kept current as the build progresses.

## Levels

### Unit tests (Vitest)

Run with `npm run test` (`vitest run --passWithNoTests` — passes with zero tests so CI isn't blocked before any exist). Highest-value Phase 1 targets, in priority order:

1. **`lib/semantic/query-compiler.ts`** — the dataset/metric/dimension → parameterized-SQL translation. This is the single riskiest piece of logic in Phase 1 (gets query correctness and SQL-injection safety both wrong at once if broken), so it gets the most thorough test coverage: one aggregation type per test, filter combinations, and a check that every value lands as a bound parameter, never string-interpolated.
2. **`lib/connectors/postgres/*`** — mocked-driver tests confirming the read-only transaction wrapper and `statement_timeout` are always applied, and that `testConnection`/`listTables` handle the three failure classes from `docs/UX.md` §3.2 (network, auth, SSRF-denylist) distinctly.
3. **`lib/auth/rbac.ts`** — role-check helpers, once they exist; table-driven tests over all role × action combinations.

Not unit-tested by design: React components. Phase 1 has no component-test setup (no Testing Library) — widget/designer correctness is verified by hand against `docs/UI.md`/`docs/UX.md` during development (see Manual below), not automated, until there's enough UI surface to justify the setup cost.

### Database / RLS tests

No automated RLS test suite yet — currently verified manually per the plan's Verification step 2: sign up two separate accounts/orgs locally, confirm each is blocked from the other's data by querying as both. Candidate for automation later via `supabase test db` (pgTAP) once the schema stabilizes past Phase 1; premature before then since every new table would need its own pgTAP file rewritten as the schema still moves.

### Migration lint

`supabase db lint` runs in CI (`.github/workflows/ci.yml`, `migration-lint` job) against a local Supabase instance spun up via `supabase/setup-cli`, on every PR — catches invalid migrations before merge, separate from the app's own lint/typecheck/test job.

### Manual / exploratory

Until there's a UI to automate against, every new flow (signup → org provisioning, data source connection test, dataset/metric creation, dashboard designer, filters) is walked through manually against the step-by-step flows in `docs/UX.md` §3 before being considered done — each flow's "Edge case" callouts there double as a manual test checklist.

### Production smoke check

`GET /api/health` (see `app/api/health/route.ts`) confirms the deployed app can reach Supabase. Not authenticated — deliberately excluded from `proxy.ts`'s login redirect (see `docs/CHANGELOG.md` / commit history for why) so it stays usable as an uptime/deploy check.

## What's intentionally not tested in Phase 1

- **End-to-end browser tests** (Playwright/Cypress) — no suite yet. Worth adding once the designer/viewer UI exists in enough depth that manual walkthroughs stop scaling; premature on a single-page app shell.
- **Load/performance testing** — not relevant until there's real traffic; the Supabase performance advisor (run after every migration, see `STATUS.md`) is the Phase 1 substitute for catching obvious scaling mistakes early.
- **Visual regression testing** — deferred past Phase 1; `docs/UI.md` is the source of truth checked by eye for now.

## Running checks locally

```bash
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run format:check  # Prettier
npm run test           # Vitest
npm run build          # production build (catches most runtime config issues early)
```

All five run in CI on every PR (`checks` job) plus the separate `migration-lint` job for Supabase migrations.
