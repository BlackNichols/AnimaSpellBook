# Testing Guide

## Goals
Prevent regressions across the full stack: pure logic **and** UI bindings/reactivity (Alpine + DOM + URL state). Unit tests alone are insufficient for this client-only Alpine app.

## Layers (run on every change)

| Layer | Tool | Scope | Command |
|---|---|---|---|
| **Unit** | Vitest (jsdom) | Pure functions and store/component logic (`filters`, `search`, `sort`, store state). No Alpine runtime. | `npm test -- --run` |
| **Integration (UI binding)** | Vitest (jsdom) + real Alpine | Mount real markup, register components/store, `Alpine.start()`, assert DOM + reactivity. Covers `x-model`/`x-show`/events/URL-driven UI sync. | `npm test -- --run` (included) |
| **E2E smoke (preview gate)** | Playwright | Real browser against built app: critical user flows (load, search, filters, toggles, URL). Required for `/verify` and Definition of Done. | `npm run e2e` / `npm run e2e:preview` |
| **E2E dev (TDD iteration)** | Playwright | Same specs against Vite dev server for fast red/green feedback during TDD/fix iteration. Not a substitute for the preview gate. | `npm run e2e:dev -- <spec>` |
| **Quality gates** | ESLint, TypeScript, Vite build | Lint/type/build correctness. | `npm run lint && npm run build` |

## Required workflow (per step/feature)
1. **TDD for user-visible behavior**: add/extend an integration (or E2E smoke) case for the behavior *before* wiring UI; add unit tests for pure logic. For UI/routing/URL/view-binding changes, prefer a vertical slice with integration/E2E coverage of the rendered contract.
2. Implement the smallest change to pass (use `/implement` for planned chunks to load context, check spec/plan coherence, then deliver one chunk end-to-end within spec contracts).
3. Run the verification gate before claiming completion: use `/verify` and follow `AGENTS.md` (Definition of Done). At minimum for code changes run `npm run lint && npm test -- --run && npm run build`; for UI/flow/routing/URL/navigation/asset/base/serving changes also run `npm run e2e` (preview/build gate, automated coverage required—no manual substitute for deep-link/refresh behavior). During TDD iteration, `npm run e2e:dev -- <affected spec>` may be used for fast red/green feedback; the final gate still requires `npm run e2e`.
4. For non-trivial changes, use `/assess` to assess test adequacy/coherence and architectural/contract risks against this guide.

## Playwright modes
- **Preview/gate (`playwright.config.ts`, port 4173):** builds and serves via `vite preview`. Use `npm run e2e` / `npm run e2e:preview` for `/verify`, Definition of Done, CI, and any gate evidence.
- **Dev/TDD (`playwright.dev.config.ts`, port 4175):** runs against `vite dev` for fast HMR feedback. Use `npm run e2e:dev -- <affected spec>` during TDD red/green iteration only; do not claim gate completion from dev runs.
- **Base-path/GitHub Pages (`playwright.base.config.ts`, port 4174):** separate config for `/AnimaSpellBook/` base-path coverage.
- **Server reuse:** Preview/base gate configs default `reuseExistingServer` off for deterministic builds; set `PW_REUSE_SERVER=1` to opt in when you know the server is current. Dev/TDD config reuses an existing server by default (`!process.env.CI`) because Vite HMR keeps it current; use the dedicated port 4175 to avoid collisions.

## What must have integration/E2E coverage
- **URL params ↔ UI ↔ results** (e.g. loading with `?q=` shows the query in the input and filters rows).
- **Routing and view contracts**: navigation updates the URL and the rendered view/state re-evaluates accordingly (not just URL/state changes).
- **Deep links, refresh, and nested-route serving**: direct load/refresh of history routes (e.g. `/spellbooks/:id`) and SPA fallback/asset/base resolution in relevant dev/build/preview contexts must be covered by automated E2E for affected routing/URL/asset/serving changes.
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
- **Router/view disconnect**: route changes update the URL but the rendered view does not switch (Alpine-reactive state not tracked by templates, multiple URL/history writers competing, or view bindings reading stale state).
