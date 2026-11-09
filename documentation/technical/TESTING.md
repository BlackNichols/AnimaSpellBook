# Testing Guide

## Goals
Prevent regressions across the full stack: pure logic **and** UI bindings/reactivity (Alpine + DOM + URL state). Unit tests alone are insufficient for this client-only Alpine app.

## Layers (run on every change)

| Layer | Tool | Scope | Command |
|---|---|---|---|
| **Unit** | Vitest (jsdom) | Pure functions and store/component logic (`filters`, `search`, `sort`, store state). No Alpine runtime. | `npm test -- --run` |
| **Integration (UI binding)** | Vitest (jsdom) + real Alpine | Mount real markup, register components/store, `Alpine.start()`, assert DOM + reactivity. Covers `x-model`/`x-show`/events/URL-driven UI sync. | `npm test -- --run` (included) |
| **E2E smoke** | Playwright | Real browser against built app: critical user flows (load, search, filters, toggles, URL). | `npm run e2e` |
| **Quality gates** | ESLint, TypeScript, Vite build | Lint/type/build correctness. | `npm run lint && npm run build` |

## Required workflow (per step/feature)
1. **TDD for user-visible behavior**: add/extend an integration (or E2E smoke) case for the behavior *before* wiring UI; add unit tests for pure logic.
2. Implement the smallest change to pass.
3. Run: `npm test -- --run && npm run lint && npm run build`. Run `npm run e2e` for UI/flow changes (or before merge) once browsers are installed (`npx playwright install`).

## What must have integration/E2E coverage
- **URL params ↔ UI ↔ results** (e.g. loading with `?q=` shows the query in the input and filters rows).
- **Every interactive control**: search input filters on typing; filter options change results; sidebar hide/show; per-filter-section collapse/expand.
- **Core list rendering**: default columns (`Name, Path, Level, Description`/`effect`), all bundled spells load, default path/level/free-access order, stats/count.

## Conventions
- Unit: `src/**/*.test.ts` near the code (current pattern).
- Integration: `src/**/*.integration.test.ts` (Vitest, jsdom, boots Alpine; **do not** import `src/main.ts` — register the needed components/store in the test).
- E2E: `e2e/*.spec.ts` (Playwright).
- Prefer assertions on user-visible outcomes (input values, visible rows/count, `aria-expanded`, URL) over internal implementation details.
- Reset DOM/URL/history between integration tests to avoid cross-test leakage.

## Regression cases these layers exist to catch
- Search input not filtering / store not reactive in the view (Alpine reactivity + event binding).
- Query params applied to state but not reflected in controls (state → UI binding on load).
- Toggle/collapse clicks not updating the DOM (reactive state owned outside Alpine data).
