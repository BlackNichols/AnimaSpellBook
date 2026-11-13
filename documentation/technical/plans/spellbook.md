# Plan: Spellbook

- **Status:** Draft
- **Date:** 2026-11-12
- **Functional spec:** `documentation/specifications/features/SPELLBOOK.md`
- **Technical spec:** `documentation/technical/decisions/spellbook.md`
- **Related docs:** `AGENTS.md`, `documentation/technical/TESTING.md`, `documentation/technical/INVARIANTS.md`

## Goal & Scope

- **Goal:** Deliver spellbook management (multiple books, sections, ordering/movement, add from list), local persistence, JSON export/import, and read-only PDF export with deep-linkable routing and cross-browser parity, as defined in the functional spec.
- **In scope (chunks cover):** History routing and view model (`/`, `/spelllist`, `/spellbooks`, `/spellbooks/:id`, `/spellbooks/:id/print`), list filter preservation/restoration and clear-filters, spellbook domain/state and localStorage persistence, section/spell CRUD/ordering/movement and add-from-list flows (including create-on-add), JSON export/import with boundary validation and atomic/error behaviors, PDF export via Paged.js (read-only, searchable, A4 2-column), and required automated coverage per acceptance/risk mapping.
- **Out of scope:** Per-spell notes/custom edits, URL-encoded spellbook content, combined JSON+PDF export, pixel-perfect web/PDF pagination parity, drag-and-drop ordering, file-upload import UX beyond JSON payload handling, navigating from spellbook entry to spell details, and “clear spellbook” action.

## Chunks (vertical slices)

Default order (recommended, not a straitjacket). Each chunk is independently valuable and verifiable.

### Chunk 1 — Foundational routing, list view, and filter preservation

- **Status:** Done
- **Functional perimeter:** Establish History routing as the single URL owner for `/` and `/spelllist` with existing list behavior preserved; enable navigation between spell list and spellbook screens without losing list filters; provide a “Clear filters” control; ensure deep-link/refresh and asset/base behavior work on nested routes under required bases.
- **Acceptance criteria (traceable to functional spec):**
  - [x] `/` redirects to `/spelllist` preserving query params (§3). `/spelllist` renders the spell list and supports existing search/filter/sort/columns behavior.
  - [x] List filter/search state is preserved across navigation away from and back to `/spelllist` and restored on return; a “Clear filters” control resets all active search/filter criteria to defaults (§3, §8.1).
  - [x] Route/URL changes drive the correct rendered view/state with no competing URL writers; list params are scoped to `/spelllist` (INV-URL-SINGLE-WRITER, INV-ROUTE-RENDER, tech spec D1).
  - [x] SPA fallback and asset/base handling support deep-link/refresh of nested History routes in dev/build/preview for supported base paths (`/`, `/AnimaSpellBook/`) with automated E2E coverage for affected routing/serving behavior (§3, §10, testing guide).
- **Dependencies:** Validation spikes — SPA fallback & base path for nested History routes; localStorage quota/error behavior (baseline handling awareness).
- **Notable risks / contracts:** Router sole URL/history writer and route→view contract (D1, D3); preserve/restore and clear-filters behavior (D1, D3, D7); SPA fallback/base correctness and nested-route deep-link/refresh (D1, §3 design/serving). Cross-cutting invariants INV-URL-SINGLE-WRITER, INV-ROUTE-RENDER. Required coverage per tech spec §5 (routing/list params) and testing guide (URL↔UI↔results, routing/view contracts, deep-link/refresh/serving).
- **Verification:** `/verify` for chunk scope; `/assess` if non-trivial. Required automated tests per acceptance/risk mapping (integration + E2E for routing, list params, preservation/restore, clear-filters, deep-link/refresh/base). Independent `reviewer` initially flagged missing nested-route deep-link/refresh and preserve/restore E2E; addressed in follow-up fix cycle. Gate: `npm run lint`, `npm test -- --run`, `npm run build`, `npm run e2e` all pass (2026-11-12).

### Chunk 2 — Spellbook domain, persistence, and management/edit views

- **Status:** Done
- **Functional perimeter:** Introduce spellbook domain and local persistence; support multiple spellbooks with create/rename/delete/duplicate/switch and single active/editable semantics; provide `/spellbooks` management/empty state and `/spellbooks/:id` editable view with correct route transitions.
- **Acceptance criteria (traceable to functional spec):**
  - [x] `/spellbooks` is always reachable and shows management (selector/list and create), including an empty state allowing creation when no spellbooks exist (§3, §7, §10). `/spelllist` remains available.
  - [x] Only one spellbook is active/editable at a time. `/spellbooks/:id` is the editable view and navigating to it makes it active; selecting a spellbook navigates to `/spellbooks/:id` and activates it (§3, §7).
  - [x] Create produces a new spellbook with a default/incremented name (new UUID) and it can be made active/managed; rename updates the spellbook name; duplicate copies content/structure into a new spellbook (new UUID, default/incremented name) (§2, §7).
  - [x] Delete removes a spellbook. Deleting the active spellbook navigates to `/spellbooks` (empty state if none remain). Unknown/missing `/spellbooks/:id` redirects to `/spelllist` (§3, §7, §10).
  - [x] All spellbook changes are auto-saved to `localStorage` and restored on revisit without partial/corrupt state on load/save failures; full spellbook content is never stored in the URL (routes identify view and spellbook ID only) (§2, §8.1, §10).
- **Dependencies:** Chunk 1 (router and view rendering).
- **Notable risks / contracts:** `SpellbookStore` as single writer for spellbook domain/persistence and route↔active coordination (D2, D3, D4). Versioned persistence envelope and boundary parse/validate with safe failure (D4). Route/identity transitions and redirects (D1, D3). Cross-cutting invariants INV-PERSISTENCE-ROUNDTRIP, INV-ROUTE-RENDER, INV-URL-SINGLE-WRITER; feature invariants spellbook/route identity consistency (tech spec §6). Required coverage per tech spec §5 (management, transitions, persistence).
- **Verification:** `/verify` for chunk scope; `/assess` if non-trivial. Required automated tests per acceptance/risk mapping (unit for domain/persistence, integration for store↔UI/route binding, E2E for key create/select/duplicate/delete/deep-link flows). Gate: `npm run lint`, `npm test -- --run` (11 files, 71 tests), `npm run build`, `npm run e2e` (15 passed) all pass (2026-11-13). Implemented in TDD cycles: SpellbookStore domain/persistence (150f024/5b65423), router `/spellbooks/:id` + active/redirect/delete-active coordination (1336c8a/5ac560d), app/store wiring and management/edit UI scaffolding (9ba0535/6ac9bf1). Added `e2e/spellbooks.spec.ts` for management flows, deep-link/refresh of editable route, and unknown-id redirect. Independent `reviewer` subagent assessment still required before proceeding to next chunk.

### Chunk 3 — Sections, spell addition, ordering, and movement

- **Status:** Planned
- **Functional perimeter:** Deliver section management and spell organization within active spellbooks, including add-from-list flows (individual and all filtered/displayed), create-on-add, deduplication/placement/snapshot, section conversions/placement/deletion/clear, and spell reorder/move/bulk-move behaviors.
- **Acceptance criteria (traceable to functional spec):**
  - [ ] Adding a spell or all filtered/displayed spells when no spellbook exists creates a default-named active spellbook and adds the spells (§4.2, §10). Target selection supports existing section or creating a new one (with name) when named sections exist; otherwise adds to default/unnamed section (§4.2, §5.1).
  - [ ] Add-all-filtered snapshots current displayed/filtered results and appends added spells to the end of the target section in displayed order; later filter changes do not affect already added spells. Duplicates already in the target section are skipped; a spell is not duplicated within the same section (§4.1, §4.3, §6, §10).
  - [ ] Section lifecycle and conversions follow spec: creating the first named section converts the default section (all spells moved in, user-chosen name); deleting the last named section moves its spells into unnamed default section (no header); deleting a non-last named section prompts to delete spells with it or move them to a chosen existing section (§5.1, §5.2, §5.5, §10).
  - [ ] Users can create/rename/delete/reorder sections (1-based position edit) and clear a section (removes only its spells). Empty named sections remain, render in web (header only), and are preserved in exports (§5.2–§5.5, §9, §10). New section placement can be first, last, or specific position number (§5.3).
  - [ ] Spells reorder within a section via move up/down and/or 1-based position edit; a moved spell (single or bulk, to existing or new section) is placed at the end of the target section. Bulk move supports multi-select then move selected to target (§6, §10). Cross-section drag-and-drop remains out of scope.
- **Dependencies:** Chunk 2 (active spellbook, domain/persistence, editable view). Chunk 1 (list/filter snapshot source and preserved list state).
- **Notable risks / contracts:** Domain-enforced rules for add/target/dedupe/snapshot, section placement/conversion/delete/clear, ordering/clamp, and move-to-end (D7, D4). No intra-section duplicate spell IDs and ordered references (tech spec §2, §6; D4). Uniform section model (`name:null` default). Required coverage per tech spec §5 (add, sections, ordering/move) and testing guide (interactive controls, integration of UI binding).
- **Verification:** `/verify` for chunk scope; `/assess` if non-trivial. Required automated tests per acceptance/risk mapping (unit for domain rules/edge cases, integration for add/move/section UI flows and rendered contracts).

### Chunk 4 — JSON export and import

- **Status:** Planned
- **Functional perimeter:** Provide per-spellbook JSON export and import as canonical editable save, with overwrite-or-create choice, strict validation, unknown-ID handling, and atomic application preserving valid state.
- **Acceptance criteria (traceable to functional spec):**
  - [ ] JSON export produces a single spellbook payload representing that spellbook’s persisted state; JSON and PDF exports are separate actions (§8.2, §8.3).
  - [ ] On import, user is prompted to overwrite the active spellbook or create a new spellbook from the payload (§8.2).
  - [ ] Invalid payloads display an error and apply no partial/corrupt state. Spell `id` references not present in the current dataset are skipped and an error summary lists skipped IDs; remaining valid content is imported (§2, §8.2, §10).
  - [ ] Valid import is applied atomically per contract (overwrite replaces active book content while keeping active identity/route stable; create-new creates a new spellbook) and preserves valid content/order per spec/contract; empty named sections are preserved (§5.2, §8.2, tech spec D5).
- **Dependencies:** Chunk 2 (spellbook domain/persistence, active book). Chunk 3 (section/spell shape and normalization rules).
- **Notable risks / contracts:** Versioned single-book payload and boundary runtime validation/normalization (D4, D5). Overwrite keeps active UUID / regenerate section IDs; create-new mints new IDs (D5). Atomic apply, no partial/corrupt state, unknown-ID skip with summary (INV-IMPORT-NO-PARTIAL, INV-PERSISTENCE-ROUNDTRIP). Required coverage per tech spec §5 (JSON boundary, round-trip/error cases).
- **Verification:** `/verify` for chunk scope; `/assess` if non-trivial. Required automated tests per acceptance/risk mapping (unit for schema/validation/normalization, integration for import flows/UI errors/summaries and export/import round-trips).

### Chunk 5 — PDF export (read-only, Paged.js, searchable)

- **Status:** Planned
- **Functional perimeter:** Provide user-initiated PDF export of a spellbook via browser print dialog using a dedicated read-only, deep-linkable print view with Paged.js pagination, searchable text, and good-enough visual/layout parity across supported browsers.
- **Acceptance criteria (traceable to functional spec):**
  - [ ] `/spellbooks/:id/print` is a deep-linkable, read-only rendering of the spellbook (same content and section/spell order, equivalent styling intent, no edit/management controls); unknown/missing print route targets redirect to `/spelllist` (§3, §8.3, §9, §10).
  - [ ] Export is triggered via browser print dialog (Save as PDF) with a default filename; no custom in-app preview or export options required. PDF export is separate from JSON export (§8.3).
  - [ ] Exported/saved PDF contains selectable, searchable real text (e.g. spell names findable via Ctrl+F) and renders with good-enough visual/layout parity across at least Chromium and Firefox (§8.3, §9, §10).
  - [ ] Print layout follows spec: A4 portrait with standard margins, two-column flow filling left column then right column (per page) with variable-height spells, spell may split across columns but should avoid splitting across pages (last resort allowed if a spell cannot fit) (§9).
  - [ ] Headers/footers/metadata: optional spellbook title shown at start (display “Spellbook” if empty/unnamed), section headers for named sections (default/unnamed has no header), page numbers at bottom of each page; no generation date or path labels as metadata (§9). Empty named sections render header-only in PDF (§5.2, §10).
- **Dependencies:** Chunk 2 (spellbook resolution/data and routes). Chunk 3 (section/spell content, ordering, empty-section rendering). Validation spikes — Paged.js searchable PDF in Chromium & Firefox; Paged.js 2-column flow & break rules; Paged.js performance & integration.
- **Notable risks / contracts:** Dedicated read-only print route and Paged.js pagination with searchable text (D6). Cross-browser (Chromium/Firefox) parity and print rules (D6, §9). SPA fallback/base/asset loading for nested print route (D1, serving). Required coverage per tech spec §5 (PDF/print route and content) and testing guide (deep-link/refresh, routing/view). Spike-validated behaviors (searchability/pagination/breaks/perf) must be verified; missing automated coverage for affected user-visible/routing/serving behavior is blocking per reviewer guidelines.
- **Verification:** `/verify` for chunk scope; `/assess` if non-trivial. Required automated tests per acceptance/risk mapping (E2E for print route/rendering/deep-link/refresh and stable assertions; spike-driven verification for cross-browser searchable PDF and pagination/break behavior, automated where feasible).

## Validation spikes / prerequisites

| Spike or prerequisite | Why | How to verify | Status |
|---|---|---|---|
| SPA fallback & base path for nested History routes | Ensure `/spelllist`, `/spellbooks`, `/spellbooks/:id`, `/spellbooks/:id/print` deep-link/refresh work in dev/build/preview under base `/` and `/AnimaSpellBook/` with correct assets (D1, INV-ROUTE-RENDER). | Configure fallback if needed; run dev/preview and verify nested-route direct load/refresh; add automated E2E for deep-link/refresh and asset/base on nested routes (Chunk 1 prerequisite/gate). | todo |
| Paged.js searchable PDF in Chromium & Firefox | Confirm Save-as-PDF from Paged.js-paginated HTML preserves selectable/searchable real text in supported browsers (D6). | Prototype print view with representative content; save as PDF in Chromium and Firefox and verify text selection/search; document constraints. | todo |
| Paged.js 2-column flow & break rules | Validate A4 2-column left-then-right flow, variable-height spells, split rules, title/headers/page numbers across Chromium/Firefox (D6, §9). | Prototype with complex/large spellbook cases; iterate layout/break behavior; compare browsers. | todo |
| Paged.js performance & integration | Ensure pagination time/memory acceptable for large spellbooks and library loads in dev/build/preview with app base path (D6). | Measure on representative large dataset; verify dev/build/preview loading and print route behavior. | todo |
| localStorage quota/error behavior | Handle read/write/parse/quota failures safely without corrupting in-memory or persisted state (D4, INV-PERSISTENCE-ROUNDTRIP). | Simulate quota/parse/write errors; confirm safe handling, no partial state, and appropriate user feedback strategy. | todo |

## Fixes / findings

Record user-reported bugs and review findings remediated on completed/reopened work (use `/fix`).

| ID | Source (bug/finding) | Chunk | Summary | Status | Outcome / evidence |
|---|---|---|---|---|---|
| F1 | Review finding (advisory) | 1 | `SpellStore.fromURLParams` only applied present params and did not reset omitted fields; router could enter `/spelllist` with stale prior filter state when URL omitted them, risking URL↔UI↔results divergence. | done | `src/stores/spellStore.ts` resets to canonical defaults before applying URL params. Unit: `src/router/router.test.ts` (“deep-links with subset params…”). Default e2e routing subset case added in `e2e/routing.spec.ts`; `npm test -- --run src/router/router.test.ts src/stores/spellStore.test.ts` passed (13). |
| F2 | Review finding (advisory) | 1 | Playwright `test-results/*` artifacts were git-tracked despite ignore rule, causing churn/noise. | done | Untracked committed artifacts via `git rm --cached -r --ignore-unmatch test-results`; `.gitignore` keeps `test-results/` ignored. |
| F3 | Review finding (advisory) | 1 | Automated E2E coverage for nested History routes/deep-link+refresh/assets under base `/AnimaSpellBook/` was missing (unit coverage only). | done | Added base-path Playwright config/spec (`playwright.base.config.ts`, `e2e/routing.base.spec.ts`, excluded from default config). Evidence: base build+preview run passed nested `/spellbooks` deep-link/refresh/rendered-view/assets and `/spelllist` query handling under `/AnimaSpellBook/`. |
| F4 | Review finding (advisory) | 1 | Unknown app paths redirect to `/spelllist` baseline; future routes must enforce spec-specific redirects (guardrail). | accepted | No code change now (Chunk 1 scope). Guardrail recorded for Chunk 2/5 route additions and tests per tech spec D3. |

## Modification rules

- **Autonomous (record rationale in change log):** reorder upcoming chunks, split/merge, adjust internal approach, mark a step irrelevant based on findings, or perform routine fix bookkeeping (reopen to `fixing`, link finding/issue, status/outcome updates)—only if functional scope/acceptance criteria and technical-spec decisions/contracts are preserved.
- **Consult user first:** drop/defer a chunk or requirement, change functional scope or acceptance criteria, major reprioritization, or deviate from a technical-spec decision/contract.

## Change log

| Date | Change | Rationale | User consulted? |
|---|---|---|---|
| 2026-11-12 | Chunk 1 marked Done. Implemented base-aware router, reactive route/view wiring, clear-filters and list-param preserve/restore, SPA config and E2E for redirect/clear/preserve-restore/nested deep-link-refresh. Added follow-up fix cycle to satisfy reviewer blocking E2E gaps. | Complete Chunk 1 acceptance and verification per specs; record independent review finding and resolution. | No (implementation continuation) |
| 2026-11-13 | Reopened Chunk 1 to `Fixing` to remediate advisory review findings F1–F4 (`/fix`). | Address reported advisories in-scope (harden URL-canonical list params, untrack test artifacts, add base-path E2E evidence) and record F4 guardrail; maintain plan traceability. | No (user requested “fix as you see fit”) |
| 2026-11-13 | Chunk 2 marked Done. Added `SpellbookStore` (v1 envelope, boundary parse/validate/safe persistence, CRUD/active/duplicate/delete), router `/spellbooks/:id` editable/active view with unknown-id redirect and delete-active→`/spellbooks`, and app/UI wiring for management (empty/create/list/select/duplicate/delete) and editable view (name edit/save, route-active sync). Added unit/integration/e2e coverage (`spellbookStore.test.ts`, router Chunk 2 cases, `App.integration` scaffolding assertions, `e2e/spellbooks.spec.ts`). Gate: lint, vitest (11/71), build, Playwright (15/15) pass. | Complete Chunk 2 acceptance and verification per specs; record TDD cycles and remaining independent reviewer gate. | No (implementation continuation) |
