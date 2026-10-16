# Divya — UI Specification

_Data Insight & Visualisation Yielding Analytics_

This document defines the visual system and screen-by-screen UI spec for Divya's Phase 1 (MVP). It is the implementation reference for `components/` and `app/` — when in doubt about spacing, color, or layout, this file is the source of truth. Phase 2+ (embed white-labeling, AI panels) notes are called out explicitly so Phase 1 doesn't build itself into a corner.

---

## 1. Design Principles

1. **Data first, chrome second.** Widgets and charts get maximum contrast and space; navigation/chrome stays low-contrast and compact.
2. **Dense but not cramped.** BI users scan many numbers at once — favor information density over generous whitespace, but keep an 8px rhythm so density doesn't read as clutter.
3. **Immediate feedback.** Every data-bearing action (run query, test connection, apply filter) shows a loading state within 100ms and resolves to success/error — never a silent wait.
4. **Two audiences, two modes.** The **designer** (admin/editor building dashboards) needs power-user density and control. The **viewer** (anyone consuming a published dashboard, including embedded end-users in later phases) needs a clean, distraction-free canvas. These are visually distinct modes, not the same screen with edit handles bolted on.
5. **Theming is structural, not cosmetic, from day one.** Even though white-label embedding is Phase 2, every color in this spec is a CSS variable, never a hardcoded hex in a component — so Phase 2 can swap the token set per-tenant without touching component code.

---

## 2. Design Tokens

### 2.1 Color

Defined as CSS custom properties on `:root`, with a `[data-theme="dark"]` override block. Values below are the **default Divya theme** — Phase 2 embedding allows a tenant to override this token set.

| Token                    | Light                    | Dark      | Usage                                           |
| ------------------------ | ------------------------ | --------- | ----------------------------------------------- |
| `--color-bg`             | `#FFFFFF`                | `#0B0E14` | App background                                  |
| `--color-surface`        | `#F7F8FA`                | `#12151C` | Cards, panels, sidebar                          |
| `--color-surface-raised` | `#FFFFFF`                | `#1A1E27` | Widgets, modals (sits above `--color-surface`)  |
| `--color-border`         | `#E2E5EA`                | `#262B36` | Dividers, card borders                          |
| `--color-text-primary`   | `#0F1419`                | `#EDEFF2` | Headings, primary content                       |
| `--color-text-secondary` | `#5B6472`                | `#9BA3B0` | Labels, captions, helper text                   |
| `--color-text-muted`     | `#8A93A1`                | `#6B7280` | Disabled, placeholder                           |
| `--color-primary`        | `#4F46E5` (indigo)       | `#6366F1` | Primary actions, active nav, links              |
| `--color-primary-hover`  | `#4338CA`                | `#818CF8` | Hover state of primary                          |
| `--color-success`        | `#16A34A`                | `#22C55E` | Connected status, positive KPI delta            |
| `--color-warning`        | `#D97706`                | `#F59E0B` | Degraded/pending status                         |
| `--color-danger`         | `#DC2626`                | `#EF4444` | Errors, destructive actions, negative KPI delta |
| `--color-focus-ring`     | `#4F46E5` at 40% opacity | same      | Keyboard focus outline                          |

**Categorical chart palette** (ECharts series colors, 8 steps, colorblind-considerate — avoid pure red/green pairing):
`#4F46E5, #0EA5E9, #10B981, #F59E0B, #F43F5E, #8B5CF6, #06B6D4, #84CC16`

**Sequential palette** (single-metric heatmaps/intensity): 5-step indigo ramp `#EEF2FF → #C7D2FE → #818CF8 → #4F46E5 → #312E81`.

**Diverging palette** (variance/anomaly widgets, Phase 4): red–neutral–green, `#DC2626 → #F3F4F6 → #16A34A` (dark mode neutral midpoint `#1A1E27`).

### 2.2 Typography

- Font family: **Inter** (UI text), **JetBrains Mono** or system monospace (SQL/query editors, dataset field names in the inspector).
- Scale (rem, 16px base):

| Role        | Size / Weight      | Usage                                             |
| ----------- | ------------------ | ------------------------------------------------- |
| `text-xs`   | 0.75rem / 500      | Badges, chart axis labels                         |
| `text-sm`   | 0.875rem / 400–500 | Body default, table cells, form labels            |
| `text-base` | 1rem / 400         | Primary body copy where sm feels cramped          |
| `text-lg`   | 1.125rem / 600     | Widget titles, card headers                       |
| `text-xl`   | 1.5rem / 600       | Page titles                                       |
| `text-2xl`  | 1.875rem / 700     | KPI widget headline number                        |
| `text-3xl`  | 2.25rem / 700      | Large KPI widget headline number (full-width KPI) |

### 2.3 Spacing & Grid

- Base unit **4px**; spacing scale `4, 8, 12, 16, 24, 32, 48, 64`.
- Dashboard canvas grid: **12 columns**, row height **40px**, gutter **12px** (matches `react-grid-layout` defaults, see UI component spec §6.3).
- Page content max-width: **none** for dashboards (full-bleed canvas); **1280px** centered for settings/list pages.
- Border radius: `--radius-sm: 6px` (buttons, inputs), `--radius-md: 10px` (cards, widgets), `--radius-lg: 16px` (modals).
- Shadows: `--shadow-sm` (1px border + barely-there shadow for cards at rest), `--shadow-md` (dropdowns, popovers), `--shadow-lg` (modals).

### 2.4 Iconography & Elevation

- Icon set: **Lucide** (tree-shakeable, consistent 24px grid, matches Inter's geometry).
- Elevation order (z-index): base content (0) → sticky filter bar (10) → sidebar/topbar (20) → dropdowns/popovers (30) → modals (40) → toasts (50).

---

## 3. App Shell & Navigation

### 3.1 Layout structure (authenticated app, non-viewer-mode)

```
┌─────────────────────────────────────────────────────────┐
│ Topbar: [Org switcher ▾]      [Search]      [Avatar ▾]   │  56px height
├───────────┬─────────────────────────────────────────────┤
│           │                                               │
│ Sidebar   │  Page content                                 │
│ 240px     │  (scrolls independently of sidebar)            │
│           │                                               │
└───────────┴─────────────────────────────────────────────┘
```

- **Topbar** (`--color-surface`, bottom border): left = org switcher (dropdown showing org name + plan badge, "Create organization" at the bottom of the list); right = global search (Cmd+K opens a command palette — stub in Phase 1, wire up fuzzy nav to dashboards/datasets only), user avatar menu (Profile, Settings, Sign out).
- **Sidebar** (`--color-surface`, collapsible to 64px icon-only rail via a toggle at the bottom): nav items in order —
  - **Dashboards** (icon: `layout-dashboard`)
  - **Datasets** (icon: `database`)
  - **Data Sources** (icon: `plug`)
  - _(divider)_
  - **Settings** (icon: `settings`) — only item visible to `viewer` role is Dashboards; Datasets/Data Sources/Settings are hidden entirely (not just disabled) for `viewer` role.
- Active nav item: left border accent (3px, `--color-primary`) + `--color-primary` text + subtle background tint.
- **Dashboard viewer mode** (published, read-only, and the future embed context) renders **without** the sidebar/topbar at all — see §3.2.

### 3.2 Viewer-mode shell (published dashboard, and the embed context in Phase 2)

```
┌─────────────────────────────────────────────────────────┐
│ Dashboard title            [Filter bar]      [⋮ Export]  │  48px, minimal
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Widget grid (read-only)                                  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

Minimal top strip only: dashboard title (left), filter bar (center/right, collapses into a "Filters (2)" button below 960px width), and an overflow menu (`⋮`) with Export (Phase 5, disabled/hidden in Phase 1) and "Open in Divya" (only shown when viewed outside the embed context, i.e., not applicable Phase 1 since embedding doesn't exist yet — Phase 1 viewer always shows the full app shell _except_ this minimal-shell pattern is what Phase 2's iframe target reuses, so build the viewer page component to not hard-depend on the sidebar).

---

## 4. Pages

### 4.1 Auth — Login / Signup

- Centered single-column card, 400px wide, on a plain `--color-bg` background (no marketing chrome in Phase 1).
- Login: email + password fields, "Sign in" primary button (full width), "Forgot password?" link below, divider, "Don't have an account? Sign up" link.
- Signup: email, password, full name, **Organization name** field (creates the org + admin membership atomically on submit — see UX flow doc for the exact sequencing/error states). Single "Create account" button; no separate "create org" step in Phase 1.
- Inline validation (on blur, not on every keystroke): red border + helper text below field on error, using `--color-danger`.
- Error from the server (e.g., "email already registered") renders as a dismissible inline banner above the form, not a toast — auth errors should stay visible until resolved.

### 4.2 Dashboards — List

- Page header: "Dashboards" title (left), "New dashboard" primary button (right).
- Grid of dashboard cards, 3 columns on desktop (≥1280px), 2 on tablet, 1 on mobile. Each card: dashboard name, small "Draft"/"Published" pill, last-edited timestamp + editor avatar, and a static thumbnail placeholder (a generic grid-of-rectangles icon in Phase 1 — real thumbnail snapshots are a later-phase nice-to-have).
- Card hover: elevate with `--shadow-md`, show a `⋮` menu (Edit, Duplicate, Delete — Delete requires a confirm dialog).
- Empty state (no dashboards yet): centered illustration + "Create your first dashboard" primary button + a secondary link "or connect a data source first" if no data sources exist yet (see §4.6 empty-state chaining).

### 4.3 Dashboard — Viewer

- Uses the viewer-mode shell (§3.2).
- Widgets render in a **non-editable** version of the grid (`react-grid-layout` with `isDraggable={false}`, `isResizable={false}`), same visual widget components as the designer.
- Each widget: title (top-left, `text-lg`), optional subtitle/description (`text-sm`, `--color-text-secondary`), the chart/table itself, and a subtle `⋮` icon top-right **only on hover** revealing "View details" (expands widget to a modal at 2x size — Phase 1 nice-to-have, not blocking) and, Phase 5, "Export this widget."
- Loading state: skeleton rectangles matching each widget's grid cell size (shimmer animation), not a spinner — preserves layout and avoids content jump.
- Widget error state (query failed/timed out): widget card shows a centered icon (`alert-triangle`, `--color-danger`) + short message ("Couldn't load data") + "Retry" link — the rest of the dashboard's widgets still render independently (one widget failing never blocks others).
- Filter bar: horizontal row of filter chips (dropdown/date-range/text per `dashboard_filters.filter_type`), each showing its current value; an "×" clears an individual filter; "Reset all" link appears only when ≥1 filter is non-default.

### 4.4 Dashboard — Designer

Two-pane layout:

```
┌─────────────────────────────┬───────────────┐
│ Toolbar: [+Widget][Filters][Publish/Draft▾]  │
├─────────────────────────────┼───────────────┤
│                              │  Config panel  │
│  Grid canvas (editable)      │  (appears only │
│                              │  when a widget │
│                              │  is selected)  │
└─────────────────────────────┴───────────────┘
```

- **Toolbar** (sticky, top of canvas): "+ Add widget" opens the widget-type picker (grid of icons + labels for the 8–12 widget types, grouped "Charts" / "Tables" / "KPI"); "Filters" opens the filter-management panel (add/edit/remove `dashboard_filters`); a Draft/Published toggle with explicit "Publish" button (not auto-publish-on-save — publishing is a deliberate action per the Phase 1 scope).
- **Canvas**: `react-grid-layout`, 12 columns, drag handles on the widget's title bar (not the whole card, to avoid accidental drags while interacting with chart tooltips), resize handle bottom-right corner only.
- **Selected widget** gets a `--color-primary` 2px outline + the right-hand **config panel** opens (320px fixed width, slides in):
  - Section "Data": dataset picker (dropdown), metric picker(s) (multi-select chips, add via "+ Metric"), dimension picker (single-select for most chart types; Phase 1 does not support multi-dimension grouping beyond one dimension + one metric-set).
  - Section "Appearance": widget title (text input), chart-specific options (axis labels on/off, legend position, color — pulls from the categorical palette by default but allows per-series override via a color swatch picker).
  - Section "Filters" (widget-scoped, optional, on top of dashboard-level filters — Phase 1 can ship with just dashboard-level filters and mark this section "Coming soon" if time-constrained, but reserve the UI slot now).
  - Sticky "Delete widget" (danger, text button) at the bottom of the panel.
- Unsaved-changes indicator: small dot on the "Publish" button area when there are edits not yet saved; autosave drafts every ~5s to avoid data loss (saves to `dashboards`/`dashboard_widgets` as draft state; does not affect the published version viewers see until explicit Publish).

### 4.5 Datasets — List & Detail

**List**: table view (not cards — datasets are more "developer tool" than dashboards), columns: Name, Data Source, Table/Query type badge, # Metrics, # Dimensions, Last updated. Row click → detail. "New dataset" button top-right.

**Detail / builder** (two tabs):

- **Tab "Source"**: shows `source_type` choice (Table vs Query) made at creation (not editable after creation in Phase 1 — changing source type is a "create a new dataset" action, avoids complex migration UX); if Table, a read-only display of schema/table name with a "Refresh schema" button (re-runs introspection, updates `columns_cache`/`dataset_fields`); if Query, a read-only SQL display (monospace, syntax-highlighted) with the same refresh action. Below: a field list table (Column name, detected type, "used in" count referencing metrics/dimensions).
- **Tab "Metrics & Dimensions"**: two sub-lists. Each metric row: label, aggregation badge (SUM/AVG/COUNT/etc.), format badge, edit/delete icons. "+ Add metric" opens an inline form (not a modal — keeps the field list visible for reference): label, underlying field (dropdown from `dataset_fields`), aggregation (dropdown), format (dropdown: Number/Currency/Percent). Same pattern for dimensions (label, field, type Categorical/Time, time grain dropdown shown only when type=Time).

### 4.6 Data Sources — List & Add/Edit

**List**: table, columns: Name, Type (icon + label, e.g. "PostgreSQL"), Status (colored dot: green=Connected, amber=Pending, red=Error, from `data_sources.status`), Last tested, actions (Edit, Test, Delete).

**Add/Edit form** (full-page, not modal — connection forms have enough fields to warrant it): grouped fields — Name; Host, Port, Database name, Username, Password (password field, never pre-filled on edit — shows a "•••• (unchanged) — click to update" placeholder pattern instead of echoing anything back); SSL mode dropdown. Bottom bar: "Test connection" (secondary button, shows inline spinner → success checkmark or error message directly below the button, not a toast) and "Save" (primary, disabled until a test has succeeded at least once for a _new_ data source — edits to an existing, already-connected source don't force re-test before save, just re-test before next use).

**Empty state chaining**: if a user lands on Datasets or Dashboards with zero data sources connected, the empty state's primary CTA is "Connect a data source" (routes here), not "Create a dataset"/"Create a dashboard" — Phase 1's empty states should always point at the actual next unblocking step, not the page's own nominal action.

### 4.7 Settings — Members

- Table: Avatar, Name/Email, Role (dropdown inline-editable for admins, read-only badge for others), Status (Active/Invited), "Remove" action (admin-only, confirm dialog).
- "Invite member" button opens a modal: email input + role dropdown; submitting creates a `memberships` row with `status='invited'` (no actual email-sending in Phase 1 — show the invite in the list immediately with a "copy invite link" affordance as the Phase-1 stand-in for a real email flow).

---

## 5. Core Components

### 5.1 Widget shell (shared wrapper for every widget type)

All 8–12 widget types render inside one shared `<WidgetCard>` shell: header (title + optional subtitle + hover `⋮` menu), body (the actual chart/table — see §5.2), and consistent loading/error/empty states (§4.3). This is what makes the widget registry (`components/widgets/registry.ts`) clean: each widget component only implements the _body_, never the chrome.

### 5.2 Chart widgets (ECharts-backed)

Bar, Line, Area, Pie, Scatter all share `<EChartsBase>` (per the plan's `shared/EChartsBase.tsx`): consistent tooltip styling (dark surface, rounded, `--shadow-md`), consistent legend placement (bottom, horizontal, wraps on overflow), consistent axis label truncation (ellipsis + full value on hover) for long category names. Grid lines use `--color-border` at reduced opacity; never pure black/white lines regardless of theme.

### 5.3 KPI / Indicator widget

Large headline number (`text-2xl`/`text-3xl` depending on grid cell size — scale the font to the cell, don't let it overflow), small label above (`text-sm`, `--color-text-secondary`), optional delta indicator below (small arrow icon + percentage, green for positive/`--color-success`, red for negative/`--color-danger` — **do not hardcode "up=good"**: a metric's format config can flag "lower is better" for things like churn, which flips the color logic).

### 5.4 Table / Pivot-table widget (TanStack Table-backed)

Dense rows (36px row height, smaller than the rest of the app's 40px default — tables need density), sticky header row, column sort via header click (sort icon appears on hover, persists when active), zebra striping optional (off by default, can be toggled in widget Appearance config), horizontal scroll with a subtle gradient-fade edge indicator rather than a hard cutoff when columns overflow the widget width.

### 5.5 Filter bar & filter controls

Pill-shaped filter chips, each chip = icon (matching filter_type) + label + current value, click opens the appropriate control inline (a popover): `select`/`multiselect` → checkbox list with search-to-filter if >8 options; `date_range` → dual calendar picker with quick-presets (Today, Last 7 days, Last 30 days, This quarter, Custom); `text` → simple text input with debounced apply (300ms).

### 5.6 Status & feedback primitives

- **Toasts**: bottom-right, auto-dismiss 4s (success/info) or persist until dismissed (error), stack vertically, max 3 visible.
- **Confirm dialogs**: centered modal, max 440px, destructive actions use `--color-danger` for the confirm button and require the button label to restate the action ("Delete dashboard", never a bare "Confirm").
- **Status dots**: 8px circle, used for data source connection status and org plan status — green/amber/red/gray(unknown) mapped consistently everywhere, never redefined per-page.

---

## 6. States, Responsiveness, Accessibility

### 6.1 Responsive breakpoints

`sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px` (Tailwind defaults, unchanged). Designer mode is **desktop-only** in Phase 1 (below `lg`, show a "Switch to a larger screen to edit dashboards" notice instead of a broken cramped canvas). Viewer mode must be usable down to `sm` (filter bar collapses to a single "Filters" button + slide-up sheet; grid widgets stack to 1 column below `md`).

### 6.2 Accessibility

- All interactive elements keyboard-reachable in DOM order; grid drag-drop (designer) also exposes a non-drag fallback ("Move" in the `⋮` menu opens a simple up/down/left/right-arrow repositioning mode) so the designer isn't mouse-only.
- Color is never the _only_ signal: status dots pair with text labels, KPI deltas pair the color with an arrow icon, chart series pair color with a legend label (never color-only differentiation for colorblind users).
- Focus ring (`--color-focus-ring`) visible on every focusable element, 2px offset outline, never `outline: none` without a replacement.
- Minimum contrast: body text ≥ 4.5:1, large/headline text ≥ 3:1 against its background in both themes (verify `--color-text-secondary` against `--color-surface` specifically — it's the easiest pairing to get wrong).

### 6.3 Dark mode

Full parity, not an afterthought — every screen in §4 must be designed/tested in both themes before Phase 1 is "done." Charts re-theme via ECharts' theme API (register a `divya-dark` theme object built from the same token values, don't hardcode chart colors separately per mode).

---

## 7. Forward Notes for Phase 2 (Embedding/White-label)

- Every color token above must remain overridable per-organization (a future `organizations.theme jsonb` or similar) — components must read CSS variables, never Tailwind-compiled static colors, for anything in the viewer-mode render path.
- The viewer-mode shell (§3.2) is deliberately the _only_ shell the iframe/embed SDK will ever render — do not let Phase 1 designer-mode assumptions leak into viewer components.
- Font family should become a token (`--font-ui`) rather than hardcoded Inter, so a tenant can match their own product's font in Phase 2.
