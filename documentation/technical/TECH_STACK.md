# Technical Stack & Architecture Decisions

## 1. Build & Runtime

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Build Tool** | Vite + TypeScript | Fast dev server, minimal config, type safety, static output |
| **Deployment Target** | Static files (`dist/`) | No server, no Node runtime, CDN-friendly |
| **Package Manager** | npm (or pnpm) | Standard, lockfile, workspaces if needed |
| **SPA Fallback** | Build emits `dist/404.html` = `dist/index.html` | GitHub Pages serves `404.html` for unknown paths so path-based routes resolve on direct load/refresh |

## 2. Frontend Architecture

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Reactivity** | Alpine.js v3 (~15kb gzipped) | Declarative, DOM-native (`x-data`, `x-bind`, `x-on`), zero virtual DOM, trivial to debug in DevTools |
| **State Management** | Alpine stores: `SpellStore` (spell data, filter/search/sort/columns, list URL state) + `SpellbookStore` (spellbook domain, active selection, persistence, import/export) | Separation of list vs spellbook concerns; reactive proxies, no external deps |
| **Routing** | Hand-rolled client-side router (History API: `pushState`, `popstate`, link interception), no dependency | Minimal, extensible path routes (`/`→`/spelllist`, `/spelllist`, `/spellbooks/:id`) with URL as source of truth for active spellbook |
| **URL Sync** | Native `URLSearchParams` | List query params (`q`, filters, sort, `cols`) scoped to `/spelllist` only; remembered in session for in-app “back to list”, clean on fresh `/spelllist` |
| **Data Loading** | Build-time bundled JSON only (`import.meta.glob`, eager). **Client-only, no server, no runtime `fetch`.** | Spell dataset included in static build output; no network I/O after load |
| **Persistence** | `localStorage` (`anima-spellbook-state`, versioned root) + plain JSON single-spellbook export/import | Auto-save/restore, shareable editable payloads; schema/invariants in `documentation/specifications/data/SPELLBOOK_DATA_FORMAT.md` |

## 3. Styling & Rendering

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **CSS Approach** | Vanilla CSS + CSS Custom Properties (Variables) | Single source of truth for design tokens, zero abstraction, trivial to inspect/override in DevTools |
| **Methodology** | BEM-like naming for components, utility classes for layout | Readable, scalable, agent-friendly |
| **Responsive** | Mobile-first, CSS Grid / Flexbox | Modern, no framework |
| **Spellbook View / PDF** | Single shared HTML/CSS renderer (editable + print-like preview); `@page` A4, 2-column `column-fill: auto`, `break-*` rules; web-only controls hidden in print (`@media print`/`.no-print`) | Content/order/styling parity between web and print without a second pipeline |
| **PDF Export** | User-triggered `window.print()` (browser save dialog) | No backend/PDF library; print-preview parity (on-screen pagination best-effort). See `documentation/technical/SPELLBOOK_RENDERING_AND_ARCHITECTURE.md` |

## 4. Tooling & Quality

| Tool | Purpose |
|------|---------|
| **TypeScript** | Strict mode, catches regressions early |
| **ESLint** (`@typescript-eslint`, `eslint-plugin-alpine`) | Lint TS + Alpine templates |
| **Prettier** | Consistent formatting |
| **Vitest** | Unit + Alpine/DOM integration tests (pure logic, store/domain invariants, UI binding/URL/route-scoped sync). See `documentation/technical/TESTING.md`. |
| **Playwright** | E2E smoke tests (real browser) for URL persistence, routing, and critical list/spellbook flows (scaffolded). |

## 5. Project Structure (Planned)

```
data/
└── spells/                 # Source-of-truth spell dataset (bundled at build time)
    ├── free_access.json
    ├── main/*.json
    └── secondary/*.json

src/
├── main.ts                 # App bootstrap, router + store init, registers Alpine components
├── router/                 # Hand-rolled History API router, route resolution/redirects
├── stores/
│   ├── spellStore.ts       # Spell data, filters/sort/search/columns, list URL (de)serialization
│   └── spellbookStore.ts   # Spellbook domain state, persistence, import/export
├── domain/ (or utils)      # Pure spellbook transforms, schema validation, serialization
├── components/
│   ├── SpellTable.ts       # x-data: table rendering, column toggles, add-to-spellbook actions
│   ├── FilterPanel.ts      # x-data: filter controls
│   ├── SearchBox.ts        # x-data: free-text search
│   ├── URLSync.ts          # x-data: reads/writes list URL params on /spelllist only
│   └── spellbook/          # Spellbook view, section/spell controls, dialogs
├── utils/
│   ├── filters.ts          # Pure filter functions (testable)
│   ├── search.ts           # Full-text scoring (testable)
│   ├── sort.ts             # Sort comparators (testable)
│   └── url.ts              # URL <-> list-state serialization
└── styles/
    ├── variables.css       # Design tokens (colors, spacing, typography)
    ├── base.css            # Reset, typography
    ├── components.css      # Component-scoped styles
    ├── layout.css          # Grid/Flex layouts
    └── print.css           # Spellbook document/print styles (@page, columns, .no-print)
```

## 6. Key Architectural Principles

1. **Pure logic separated from UI** — filter/search/sort and spellbook domain transforms/validation are pure TS, unit-testable without DOM
2. **Separated stores** — `SpellStore` owns spell/list state; `SpellbookStore` owns spellbook domain and persistence
3. **URL as source of truth for shareable state** — list filters/search/sort/columns ↔ `URLSearchParams` on `/spelllist` (bidirectional, route-scoped); active spellbook ↔ `/spellbooks/:id`
4. **No hidden transforms** — CSS is authored CSS; Alpine templates are plain HTML attributes
5. **Agent-friendly** — behavior visible in DevTools Elements panel (`x-data`, `x-bind`, CSS vars)
6. **Static/client-only** — no backend/server; spell dataset bundled at build time (no runtime fetch); spellbooks persisted in `localStorage` and shared via JSON

## 7. Related technical decisions

- Spellbook data format & persistence: `documentation/specifications/data/SPELLBOOK_DATA_FORMAT.md`
- Routing & list URL scoping: `documentation/technical/SPELLBOOK_ROUTING.md`
- Rendering, PDF, and architecture: `documentation/technical/SPELLBOOK_RENDERING_AND_ARCHITECTURE.md`
- Feature specification: `documentation/specifications/features/SPELLBOOK.md`