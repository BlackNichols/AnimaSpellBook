# Technical Stack & Architecture Decisions

## 1. Build & Runtime

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Build Tool** | Vite + TypeScript | Fast dev server, minimal config, type safety, static output |
| **Deployment Target** | Static files (`dist/`) | No server, no Node runtime, CDN-friendly |
| **Package Manager** | npm (or pnpm) | Standard, lockfile, workspaces if needed |

## 2. Frontend Architecture

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Reactivity** | Alpine.js v3 (~15kb gzipped) | Declarative, DOM-native (`x-data`, `x-bind`, `x-on`), zero virtual DOM, trivial to debug in DevTools |
| **State Management** | Alpine component stores + single global `SpellStore` | Colocated with markup, reactive proxies, no external deps |
| **Routing / URL Sync** | Native `URLSearchParams` + `history.pushState` | Transparent, bookmarkable, no router library |
| **Data Loading** | Build-time bundled JSON only (`import.meta.glob`, eager). **Client-only, no server, no runtime `fetch`.** | All spell data is included in the static build output; no network I/O after load |

## 3. Styling

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **CSS Approach** | Vanilla CSS + CSS Custom Properties (Variables) | Single source of truth for design tokens, zero abstraction, trivial to inspect/override in DevTools, no build-step magic (unlike Tailwind JIT, CSS-in-JS) |
| **Methodology** | BEM-like naming for components, utility classes for layout | Readable, scalable, agent-friendly |
| **Responsive** | Mobile-first, CSS Grid / Flexbox | Modern, no framework |

## 4. Tooling & Quality

| Tool | Purpose |
|------|---------|
| **TypeScript** | Strict mode, catches regressions early |
| **ESLint** (`@typescript-eslint`, `eslint-plugin-alpine`) | Lint TS + Alpine templates |
| **Prettier** | Consistent formatting |
| **Vitest** | Unit tests for filter/sort/search logic (pure functions) |
| **Playwright** | E2E smoke tests for URL persistence, filter combos |

## 5. Project Structure (Planned)

```
data/
└── spells/                 # Source-of-truth spell dataset (bundled at build time)
    ├── free_access.json
    ├── main/*.json
    └── secondary/*.json

src/
├── main.ts                 # App bootstrap, registers Alpine components
├── stores/
│   └── spellStore.ts       # Global reactive store: spells, filters, sort, columns, search
├── components/
│   ├── SpellTable.ts       # x-data component: table rendering, column toggles
│   ├── FilterPanel.ts      # x-data component: all filter controls
│   ├── SearchBox.ts        # x-data component: free-text search
│   └── URLSync.ts          # x-data component: reads/writes URLSearchParams
├── utils/
│   ├── filters.ts          # Pure filter functions (testable)
│   ├── search.ts           # Full-text scoring (testable)
│   ├── sort.ts             # Sort comparators (testable)
│   └── url.ts              # URL <-> state serialization
└── styles/
    ├── variables.css       # Design tokens (colors, spacing, typography)
    ├── base.css            # Reset, typography
    ├── components.css      # Component-scoped styles
    └── layout.css          # Grid/Flex layouts
```

## 6. Key Architectural Principles

1. **Pure logic separated from UI** — filter/search/sort functions are pure TS, unit-testable without DOM
2. **Single source of truth** — `SpellStore` holds all state; components are read-only projections
3. **URL as source of truth for shareable state** — filters, search, sort, columns ↔ `URLSearchParams` (bidirectional)
4. **No hidden transforms** — CSS is authored CSS; Alpine templates are plain HTML attributes
5. **Agent-friendly** — every behavior visible in DevTools Elements panel (`x-data`, `x-bind`, CSS vars)
6. **Static/client-only** — no backend/server; all spell data bundled at build time (no runtime fetch)