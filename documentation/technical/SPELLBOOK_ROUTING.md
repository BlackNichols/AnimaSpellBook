# Spellbook Routing & URL State — Technical Decisions

Decisions for client-side navigation, active-spellbook resolution, and list URL scoping. Functional behavior: `documentation/specifications/features/SPELLBOOK.md`. Data/state details: `documentation/specifications/data/SPELLBOOK_DATA_FORMAT.md`.

## 1. Router

- **Implementation:** Hand-rolled client-side router using the History API (`pushState`, `popstate`, in-app link interception). **No routing dependency.**
- **Rationale:** Small, extensible route set; minimal stack impact; full control over coordination with list URL synchronization and active-spellbook resolution.

## 2. Routes

| Path | Purpose |
|---|---|
| `/` | Redirect to `/spelllist` |
| `/spelllist` | Spell list view (search/filter/sort/columns) |
| `/spellbooks/:id` | Spellbook view (editable + print-preview) for the identified spellbook |

Route space is reserved for future domains (e.g. `/ki`, `/psychic`, `/character-builder`). `/spellbooks/:id` identifies the viewed spellbook; it does **not** encode spellbook content.

## 3. Active spellbook & route resolution

- **Source of truth:** The URL is the source of truth for the viewed/active spellbook. Opening a valid `/spellbooks/:id` renders that book and sets/persists it as active.
- **Resolution rules:**
  - Valid `:id` → render and persist as active.
  - Unknown `:id` with ≥1 spellbook existing → redirect to `/spellbooks/<activeSpellbookId>` (fall back to any existing spellbook if stored active is missing), without error noise.
  - Any `/spellbooks/*` when no spellbooks exist → redirect to `/spelllist`.
- **Mutations:** Selector/switch, duplicate, delete (active), and import-create navigate to the appropriate `/spellbooks/:id` so URL and active state remain consistent.

## 4. SPA fallback (GitHub Pages)

- **Requirement:** Path routes must resolve to the app on direct load/refresh.
- **Decision:** Build produces `dist/404.html` identical to `dist/index.html` (build-time copy). GitHub Pages serves `404.html` for unknown paths, enabling client-side route resolution. This is preferred to be handled in the build script/pipeline.

## 5. List URL state scoping (Option A)

- **Scope:** List query params (`q`, filters, sort, `cols`) are scoped to `/spelllist` only. Spellbook routes carry no list params and no spellbook content.
- **Synchronization:** List↔URL synchronization is active only on `/spelllist` and must not rewrite non-list paths. The router owns path/view changes; list sync owns query serialization on `/spelllist`.
- **Preservation for back-navigation:** When leaving `/spelllist`, the app remembers the last list search string in session memory. In-app “Back to spell list” navigates to `/spelllist?<last>` (restoring prior setup). A direct/fresh `/spelllist` visit without params shows a clean/default list.
- **Shareability:** A `/spelllist` URL with query params remains bookmarkable/shareable and restores that list state on load.

## 6. Add-from-list navigation

- When adding spell(s) and no spellbook exists, the app creates a default-named active spellbook and adds the spells but **stays on `/spelllist`**.
- Feedback: non-blocking “Added to <name>” with an action to open `/spellbooks/<id>`. Navigation to the spellbook is explicit via that action (or other spellbook navigation).
