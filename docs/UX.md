# Divya — UX Specification

_Data Insight & Visualisation Yielding Analytics_

This document covers **who uses Divya, what they're trying to do, and how the product should behave step-by-step** — flows, decision points, edge cases, and interaction rules. It complements [UI.md](./UI.md) (which defines what things look like) with _what happens when_ — the sequencing, error recovery, and judgment calls that a screenshot can't capture. Treat this as the reference when implementing a flow end-to-end, not just a single screen.

---

## 1. Personas

| Persona             | Role                                                                                   | Primary goal                                                                           | Divya role |
| ------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------- |
| **Admin (Priya)**   | Founder/lead engineer at a SaaS company embedding analytics into their own product     | Get a working analytics layer live fast, without a BI specialist on staff              | `admin`    |
| **Editor (Sam)**    | Product/data analyst who builds the actual dashboards                                  | Turn raw data into dashboards the team/customers trust, without writing SQL every time | `editor`   |
| **Viewer (Jordan)** | Internal stakeholder or (in later phases) an end-customer seeing an embedded dashboard | Answer a specific business question in under a minute, with zero training              | `viewer`   |

Phase 1 ships for Priya and Sam primarily — Jordan's experience is the _viewer mode_ (§4.3 in UI.md), and the embedded version of Jordan's experience is a Phase 2 concern, but every Phase 1 viewer-mode decision should assume Jordan eventually sees this inside someone else's product, not just inside Divya's own app shell.

---

## 2. Information Architecture

```
Divya
├── Dashboards           (viewer's only visible section)
│   ├── [list]
│   └── [dashboard] → view | edit
├── Datasets             (hidden from viewer role)
│   ├── [list]
│   └── [dataset] → source | metrics & dimensions
├── Data Sources         (hidden from viewer role)
│   ├── [list]
│   └── [data source] → add | edit | test
└── Settings             (hidden from viewer role)
    └── Members & roles
```

The IA is deliberately **shallow** (max 2 levels deep anywhere) — a BI tool used occasionally by non-specialists should never require more than two clicks to reach any object. This is a direct reaction to Looker/Qlik's "excellent for dedicated analyst teams, steep learning curve for everyone else" reputation noted in the competitive research — Divya's Phase 1 bar is "a product manager who's never used a BI tool can connect data and build a dashboard in one sitting without a tutorial."

---

## 3. Core User Journeys

### 3.1 First-run / onboarding (Priya, new signup → first dashboard)

```
Signup form ──► Org auto-created ──► Empty "Dashboards" page
                                            │
                                            ▼
                              Empty state: "Connect a data source"
                                            │
                                            ▼
                         Data source form ──► Test connection
                                            │           │
                                       success       failure
                                            │           │
                                            ▼           ▼
                                   Save & redirect   Inline error,
                                   to new dataset     stay on form,
                                   creation flow      retry
                                            │
                                            ▼
                         Dataset builder (pick table) ──► introspection runs
                                            │
                                            ▼
                              "Add your first metric" prompt
                                            │
                                            ▼
                         Metric created ──► "Create a dashboard with this?"
                                            │  (one-click: creates dashboard +
                                            │   one widget pre-bound to this metric)
                                            ▼
                              Dashboard designer, one widget already placed
```

**Design rule**: every step's empty state links forward to the _next_ step in this exact chain (see UI.md §4.6's "empty-state chaining" note) — a new user should never have to figure out the IA on their own to go from zero to one working widget. Measure this chain's drop-off per step once there's real usage; it's the single most important Phase 1 funnel.

**Edge case — signup org-creation failure**: if org/membership provisioning fails after the `auth.users` row is created (partial failure), the user must not be left in limbo. On next login, if a user has zero memberships, route them straight to a "Create your organization" form instead of a broken empty dashboards page — this recovery path must be built even though it's rare, because there's no support team to manually fix it in Phase 1.

### 3.2 Connect a data source (Priya or Sam)

1. Click "Connect a data source" → form (UI.md §4.6).
2. Fill connection details. **Password field**: plain text entry, never pre-validated client-side beyond "non-empty" — all real validation happens server-side via the actual connection attempt.
3. Click "Test connection" → button shows spinner, all other form fields become read-only (not disabled-grey, just non-interactive) during the test to prevent a race where the user edits a field mid-test.
4. **Success**: green inline confirmation ("Connected — found 14 tables"), "Save" button enables.
5. **Failure**: red inline message with the _actual_ driver error where safe to show (e.g., "connection refused" or "authentication failed"), never a raw stack trace. Specifically distinguish three failure classes in the copy, because the user's next action differs:
   - _Network/host unreachable_ → "Check the host and port, and that this database accepts connections from the internet (Divya connects from AWS us-east-1)." — tells them it might be a firewall issue on their end.
   - _Auth failure_ → "Check the username and password." — nothing else to suggest.
   - _SSRF-denylist rejection_ (host resolves to a private/internal address) → a distinct, deliberately vaguer message: "This host can't be reached." Do not reveal that it was blocked for being a private IP — that's an internal safety detail, not user-facing troubleshooting info.
6. On Save, redirect to the data source list with a success toast, **not** straight into dataset creation (that forward-chaining only happens from the onboarding empty-state flow in §3.1; a returning user adding a 2nd/3rd data source just wants to land back on the list).

### 3.3 Build a dataset + define metrics (Sam)

1. From Datasets list, "New dataset" → choose Data Source (dropdown, only shows sources with `status='connected'`) → choose Table or Query.
   - **Table path**: picks schema + table from a searchable dropdown (populated by `listTables()`); on selection, immediately runs introspection and shows the field list live — no separate "confirm" step.
   - **Query path**: a SQL textarea (monospace) + "Run & preview" button that executes the query read-only with `LIMIT 50` to populate the field list and a sample-rows preview table, _before_ the dataset is saved. This preview-before-save step exists specifically so an editor can catch a bad query without having already created a half-broken dataset.
2. Name the dataset, Save. Lands on the dataset detail page, "Metrics & Dimensions" tab, with an inline prompt if zero metrics exist yet: "Add your first metric from `<field list>`."
3. Adding a metric: pick a field → aggregation defaults intelligently by the field's detected data type (numeric field defaults to `sum`; the UI still lets the user change it, but the default should almost always be right without thinking). Adding a dimension: if the field's detected type is `date`/`timestamp`, default `type='time'` with `time_grain='day'`; otherwise default `type='categorical'`.
4. **Edge case — schema drift**: if "Refresh schema" (dataset detail, Source tab) finds a column that an existing metric/dimension references has been dropped from the underlying table, do not silently break. Show a non-dismissible warning banner on the dataset detail page: "`revenue_usd` is used by 2 metrics but no longer exists in the source table — fix or remove them." Link each affected metric. This must be checked and surfaced, not just allowed to fail opaquely the next time a widget tries to query it.

### 3.4 Build a dashboard (Sam, in the Designer)

1. From Dashboards list, "New dashboard" → immediately enters the Designer in an empty state (not a separate "name your dashboard" modal first — name is editable inline at the top of the canvas, defaults to "Untitled dashboard").
2. "+ Add widget" → widget-type picker → on pick, widget is placed at the next open grid position (bottom of existing content, or top-left if canvas is empty) with a sensible default size per type (KPI: 3×2 grid cells; chart types: 6×4; table: 8×4) — the user should never have to manually size a brand-new widget before it's usable.
3. Config panel opens automatically on placement, scrolled to the "Data" section first — the natural next action is always "bind this widget to a dataset," so that's what's in front of the user immediately, not Appearance options they don't need yet.
4. **Autosave**: every change (widget added/moved/resized/reconfigured) debounce-saves as a draft after ~1.5s of inactivity. This is deliberately _not_ the same as Publish — a visible but unobtrusive "Saved as draft · 2s ago" indicator near the Publish button communicates this distinction, because a new user's biggest likely confusion is "did my work save, and did my team's viewers just see my half-finished edit?" (answer: saved, yes; visible to viewers, no, until Publish).
5. **Publish**: explicit button click, confirms nothing destructive is happening (no dialog needed — publishing is reversible, just toggle back to draft... except note below), flips `is_published=true`, and the dashboard now appears for `viewer`-role users. **Un-publishing** (toggling back to draft) should warn once ("Viewers will no longer see this dashboard") because unlike most draft/publish toggles, Divya's Phase 1 viewer role literally cannot see unpublished dashboards at all (not "sees a draft label" — sees nothing), which is a sharper behavior than the user may expect.
6. **Edge case — concurrent editors**: Phase 1 does not build real-time multi-user collaborative editing (that's a later-phase concern, akin to Google Docs-style presence). Instead, a simple **optimistic-lock warning**: if Sam saves a draft and the underlying `dashboards.updated_at` has changed since Sam's edit session started (meaning someone else edited it in another tab/session), show "This dashboard was changed elsewhere — reload to see the latest, or continue to overwrite it" rather than silently clobbering the other editor's work.

### 3.5 View a dashboard + use filters (Jordan, viewer role)

1. Lands on Dashboards list → sees **only published** dashboards (drafts are invisible, not grayed out — this is a hard permission boundary, not a visual one, enforced by RLS, not just UI hiding).
2. Opens a dashboard → widgets load progressively (each widget's data fetch is independent — per §4.3 UI.md, one slow/failing widget never blocks the rest from rendering).
3. Applies a filter (e.g., date range) → every widget whose `query_config` is affected re-fetches; widgets _not_ bound to the filtered dimension visually indicate they're unaffected (no loading shimmer on them) so Jordan isn't confused about why some numbers changed and others didn't.
4. **Edge case — filter yields no data**: a widget whose filtered query returns zero rows shows a distinct "No data for this selection" state (not the same visual as an error) — chart area shows a muted empty-state icon + the message, not a blank white box that looks broken.

### 3.6 Manage team access (Priya, Settings → Members)

1. Invite by email + role. Since Phase 1 has no real email delivery, the invited user does not receive anything automatically — Priya must manually share the "copy invite link" with them (Slack, email, whatever channel). This is a known, deliberate Phase 1 limitation; **the UX must not pretend otherwise** — the success state after inviting says "Invite link created — share it with <email>," never "Invitation sent," since nothing was actually sent.
2. The invited person opens the link → if they already have a Divya account (any org), accepting attaches a new `membership` row to their existing user; if not, the link pre-fills the signup form's email (locked, not editable) and skips the "Organization name" field entirely (they're joining, not creating).
3. **Role changes**: an admin changing someone's role takes effect immediately (next page load/action for that user, not requiring them to re-login) — because RLS checks role at query time, not at session-start time, this is naturally correct and should be verified in testing, not just assumed.
4. **Edge case — last admin**: an org must always have ≥1 active `admin` membership. The UI must block a self-demotion or self-removal action that would leave zero admins ("You're the only admin — promote someone else first") rather than allowing an org to become unmanageable.

---

## 4. Interaction Patterns (cross-cutting rules)

- **Save model**: list/detail CRUD pages (data sources, datasets, members) use explicit Save buttons with clear success/error feedback. The dashboard _designer_ uses autosave-as-draft + explicit Publish (§3.4) — these are intentionally different models for different contexts, not an inconsistency: one is "configuring a record," the other is "iterating on a living canvas."
- **Destructive actions always confirm, and the confirm button restates the action** (UI.md §5.6) — "Delete dashboard," never "OK." Exception: removing a single widget from a dashboard in the designer does _not_ need a confirm dialog (it's a draft-state, easily-undoable-by-re-adding action, not data loss) — only use a lightweight "Undo" toast instead.
- **Permission boundaries are enforced twice**: at the RLS/API layer (always, non-negotiable) and reflected in the UI by _hiding_ disallowed actions/nav items rather than showing them disabled-and-greyed. A `viewer` never sees a "New dashboard" button at all; they don't see a disabled one with a tooltip explaining why. Disabled-with-tooltip is reserved for _state-based_ blocks a user can resolve themselves (e.g., "Save" disabled until a connection test passes), never for _role-based_ blocks.
- **Loading states never flash**: if a response resolves in under ~150ms, don't show a spinner/skeleton at all (avoids the jarring flash-of-loading-state on fast connections) — use a short delay-before-showing-loading-indicator pattern, not an immediate spinner on every request.
- **Errors are specific and actionable** wherever the underlying cause is known and safe to disclose (§3.2 step 5 is the template for this); generic "Something went wrong" is a last resort, not a default, and should always include a "Try again" affordance.

---

## 5. Success Metrics (how we'll know Phase 1's UX works)

These aren't instrumented in Phase 1 code, but should guide design review priority — in order:

1. **Time to first published dashboard** from signup (the §3.1 chain) — this is the number one churn risk if the chain has friction.
2. **Dataset/metric creation success rate without support** — can Sam define a correct metric on the first try, or does the aggregation-default guess (§3.3 step 3) need overriding often enough to be annoying?
3. **Viewer-side filter latency perception** — does the per-widget independent loading (§3.5 step 2–3) actually feel fast, or does progressive widget loading read as "broken/incomplete" to a first-time viewer? Watch this one specifically in user testing — progressive loading is a double-edged pattern.

---

## 6. Forward Notes for Later Phases

- **Phase 2 (embedding)**: Jordan's journey (§3.5) is the one that gets transplanted into a host application's iframe. Every interaction rule in §4 must hold true with no app-shell chrome around it — re-test §3.5 specifically inside a bare iframe before considering Phase 2 "done," not just inside Divya's own authenticated shell.
- **Phase 4 (AI/NLQ)**: the dataset/metric creation flow (§3.3) is the manual path an NL-to-SQL assistant will eventually offer to shortcut — "ask a question, get a metric + dimension pre-filled for you to confirm" should slot into step 2–3 of §3.3 as an alternative entry point, not a separate disconnected flow.
- **Phase 5 (collaboration/export)**: the widget `⋮` menu's "Export this widget" (UI.md §4.3) and a dashboard-level "Export" (UI.md §3.2 overflow menu) are already reserved UI slots — when built, they should reuse the exact query/filter state currently applied on screen (export what you see, not a fresh unfiltered pull).
