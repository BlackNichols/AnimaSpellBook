# Spellbook Rendering & Architecture — Technical Decisions

Decisions for rendering/print, view composition, and state architecture. Functional behavior: `documentation/specifications/features/SPELLBOOK.md`. Data format: `documentation/specifications/data/SPELLBOOK_DATA_FORMAT.md`. Routing: `documentation/technical/SPELLBOOK_ROUTING.md`.

## 1. Rendering & PDF export

- **Approach:** **Option 1 — single shared HTML/CSS renderer** for web and print. No Paged.js, no latex.js/TeX, no client-side PDF-generation library in this iteration.
- **PDF export:** User-triggered `window.print()` (browser print/save dialog). No additional export options in this iteration; JSON and PDF exports remain separate.
- **Page format:** `@page` A4 portrait with standard document margins.
- **Layout:** Two-column flow per page, `column-fill: auto` (fill left column top-to-bottom, then right), preserving spell/section order with variable-height content.
- **Splitting:** Prefer keeping a spell whole (`break-inside` avoidance where feasible); allow splitting across columns. Avoid splitting across pages, but allow page splits as a last resort for oversized spells.
- **Document elements (print and content):** Spellbook title at start (if empty/unnamed display `Spellbook`); named section headers (empty named sections render header only; default/unnamed section has no header); all spell information always shown; page numbers at bottom in print (CSS paged-media counters/margin boxes where supported, browser-dependent). No generation date, no path labels as metadata.
- **Web parity (relaxed):** Web spellbook view is an editable **print-like preview**, not pixel-perfect paged parity on screen. Content, order, and styling are shared with print; exact on-screen pagination is best-effort.

## 2. View composition

- **Single spellbook view:** `/spellbooks/:id` is one screen serving as editor and preview. It renders full spellbook content in the document layout and provides web-only management controls (spellbook actions, section/spell CRUD, reorder/move, multi-select, import/export triggers, dialogs/feedback).
- **Print isolation:** Web-only controls and non-document UI are hidden in print via `@media print` / `.no-print` so print/PDF outputs only the spellbook document.

## 3. State architecture

- **Separation of concerns:**
  - **`SpellStore` (existing):** bundled spell data loading, filter/search/sort/columns, derived filtered list, and list URL param (de)serialization. Extended to provide a spell-by-id lookup for spellbook rendering. No spellbook CRUD or persistence.
  - **`SpellbookStore` (new):** spellbook domain state (root: all books, active id, counters), mutations/operations (book/section/spell CRUD, ordering, move, duplicate, import/export helpers), and persistence. Exposes derived access (active book, ordered sections/spells).
- **Resolution:** Spellbook rendering resolves `spellIds` against loaded spell data (by-id index). Spell loading must be available before resolved content is shown. Defensively, stored IDs missing from the dataset at render time are omitted with a non-blocking web warning (import is the primary guard).
- **Coordination:** Router owns path/view and active-book URL resolution; `SpellbookStore` owns domain and persistence; `SpellStore` owns list state. Transient UI state (dialogs, selection, toasts/feedback) lives in view/component state.

## 4. Persistence mechanics

- **Auto-save/restore:** Full root state persisted to `localStorage` on every mutation and restored on init (key and schema defined in `documentation/specifications/data/SPELLBOOK_DATA_FORMAT.md`). Invalid/corrupt storage falls back safely; quota/unavailability handled gracefully.
- **Import/export:** Plain JSON single-spellbook envelope (see data spec). Export via download (Blob/object URL) and clipboard copy; import via paste and file picker through shared validation. Import prompts overwrite-active or create-new; invalid payloads apply no partial state; unknown spell IDs skipped with error summary.

## 5. Build & deployment note

- **SPA fallback:** Build must emit `dist/404.html` identical to `dist/index.html` to support GitHub Pages direct-load/refresh of path routes (see routing decisions). No new runtime dependencies required for routing, persistence, or PDF export.
