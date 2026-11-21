# Project Rules

- **Regression tests for reported issues:** When the user reports a bug or issue, add a test (unit, integration, or E2E as appropriate per `documentation/technical/TESTING.md`) that reproduces/prevents the regression as part of the fix. Prefer the smallest layer that can reliably catch it; use Playwright E2E for browser/first-paint/URL-load behavior that jsdom integration cannot verify.
- **Red/green for regression tests:** After adding/changing a regression test, verify it fails (RED) against the unfixed behavior (revert the fix or reproduce the bug), then apply/restore the fix and verify it passes (GREEN). Do not keep a regression test that was not observed failing for the target issue.
- Follow `documentation/technical/TESTING.md` for test strategy and placement.

## Definition of Done (Verification Gate)

Before claiming any task complete, run the verification gate (use `/verify`) and report the actual command results. Do not claim completion based on partial, stale, or subset runs.

| Change type | Required checks |
|---|---|
| Code/config/runtime changes | `npm run lint`, `npm test -- --run`, `npm run build` must all pass |
| UI, view, flow, routing, URL/navigation, asset/base, or serving changes | All of the above, plus `npm run e2e` (Playwright). Deep-link/refresh/SPA-fallback and asset/base behavior on nested routes (e.g. `/spellbooks/:id`) must be covered by automated E2E tests; missing coverage for affected behavior is a test gap to fix, not a manual substitute. If E2E cannot run, state why explicitly and treat the gate as incomplete. |
| Docs/non-runtime-only changes | State what was checked. Run lint/test/build if the change could affect them. |

- Stop on first failing required check; fix and rerun the full required gate.
- Report: change category, commands run, pass/fail per check, and any skipped checks with reason/evidence.
- For non-trivial code changes, use `/assess` (and/or the independent `reviewer` subagent) to assess test adequacy/coherence and architectural/contract risks before claiming completion. Blocking findings must be resolved and re-gated; do not claim completion while they remain.

## Conception & Planning (before/during implementation)

- **Current feature state (`.kilo/feature.json`):** centralizes the active feature context so workflow commands do not require repeating paths. Schema/convention: `.kilo/FEATURE_STATE.md`. Resolve inputs as **explicit argument > `.kilo/feature.json` > ask/stop** and report resolved source/paths. `/technical-discovery` and `/plan` populate/update it when artifacts are produced; `/implement`, `/fix`, `/assess`, `/verify`, and `/update-*` read/keep it consistent (`activeChunk`, `status`, `updatedAt`, paths). It is convenience context only (not permission/scope/approval or verification evidence); clear/replace when switching features to avoid stale context (one active feature per workspace by default).
- For non-trivial, cross-cutting, or user-visible features/changes, run `/technical-discovery` from the functional spec before implementation. It identifies material risks, agrees solutions with the user, and produces a technical spec (decisions/ADR-style rationale, contracts/ownership, risk→test mapping, validation spikes, reviewer guidelines) in `documentation/technical/decisions/`.
- `/technical-discovery` is design only. Run `/plan` to consume the functional and technical specs and produce a chunked implementation plan (vertical, end-to-end slices with functional perimeter and acceptance criteria, minimal technical/how detail) in `documentation/technical/plans/`.
- **Cross-cutting invariants:** `documentation/technical/INVARIANTS.md` is the canonical registry of project-wide invariants (guards at owning modules, exercised by tests/runs). Technical specs must reference applicable cross-cutting invariants and declare feature-specific invariants; promote feature-specific invariants to `INVARIANTS.md` if they become cross-cutting.
- **Structural validation (required):** specs and plans must pass `node scripts/check-doc.mjs --type spec|plan <path>` (required headings/sections/fields/tables populated per templates) before they are considered complete.
- Use the technical spec and plan to guide implementation and `/assess`.

## Implementation discipline

- **Use `/implement` for plan chunks:** start chunk work with `/implement` to load the functional/technical specs, plan, and current code (resolved via explicit args or `.kilo/feature.json`), validate targets, check coherence, and execute one chunk at a time. If spec/plan issues are found, consult the user before proceeding.
- **Deliver in vertical slices:** implement one plan chunk at a time, end-to-end and integratable. Avoid big-bang, cross-cutting wiring. Each chunk must satisfy its acceptance criteria and pass `/verify` for its scope and, for non-trivial work, an independent review via the read-only `reviewer` subagent (spec/plan/risk→test mapping, blocking findings must be fixed) before moving on. Use `/assess` for qualitative guidance/checks.
- **Integration/contract-first within a chunk:** for user-visible behavior, add/extend failing integration or E2E tests that assert rendered contracts before wiring UI (per `documentation/technical/TESTING.md`); TDD plugin governs red/green mechanics. Choose TDD iterations and tactical/how details autonomously within the chunk’s acceptance criteria and the technical spec’s contracts/boundaries.
- **Spec/plan changes are fail-fast and controlled:** do not modify the technical spec or plan ad-hoc during chunk/TDD work. If the spec must change, stop and use `/update-technical-spec` (then `/update-plan` if impacted) and restart `/implement`. For non-routine plan changes, stop and use `/update-plan` (respecting modification rules) and restart `/implement` as appropriate. Routine end-of-chunk plan updates are recorded during `/implement` with immediate `node scripts/check-doc.mjs --type plan <path>` validation after the edit. After any spec/plan modification, revalidate immediately (fail-fast) and do not proceed with invalid artifacts.
- **Plan is living but traceable:** update chunk status and record rationale for meaningful changes in the plan.
  - **Autonomous (no user approval):** reorder upcoming chunks, split/merge, adjust internal approach, or mark a step irrelevant based on findings—only if functional scope/acceptance criteria and technical-spec decisions/contracts are preserved.
  - **Consult the user first:** drop/defer a chunk or requirement, change functional scope or acceptance criteria, major reprioritization, or deviate from a technical-spec decision/contract. Record the outcome.

## Bug fixes & review findings

- **Use `/fix` for remediation on done/reopened work:** when the user reports a bug in reviewed/“done” behavior or when `/assess`/independent review records findings (especially after a chunk is marked done or outside the active chunk), use `/fix` instead of ad-hoc edits. `/fix` reopens/traces the affected chunk in the plan, stays within spec boundaries, and re-gates the fix.
- **User-reported bugs (regression-first):** capture reproduction/expected vs actual evidence, add a regression test at the smallest reliable layer (Playwright E2E for browser/first-paint/URL-load/navigation/SPA-fallback/asset-base behavior jsdom cannot verify), verify it fails **RED** against the unfixed behavior, then fix to **GREEN**. Do not keep a regression test not observed failing for the target issue.
- **Review findings:** blocking findings must be resolved (in-chunk before marking done, or via `/fix` when on done/reopened work) and re-verified with `/verify` and independent review until clear; no completion while blocking findings remain. Advisory findings are triaged (fix now, schedule/record as a planned fix item, or explicitly accept with rationale in the plan change log; consult the user if acceptance affects scope or risk). Record findings/fixes traceably in the plan (issue/finding, affected chunk, status/outcome) with immediate `node scripts/check-doc.mjs --type plan <path>` validation after edits.
- **Scope/control:** fixes must remain within the affected chunk’s acceptance criteria and technical-spec contracts/boundaries. If spec/acceptance must change, stop and use `/update-technical-spec`/`/update-plan` (consult user as required), revalidate, then restart `/fix` or `/implement`.

## Git-Backed TDD Enforcement Plugin (policy)

This repo loads the local plugin `../kilo-tdd-plugin/src/plugin.ts` via `kilo.json` (config: `.kilo/tdd.json`). The plugin enforces the RED → GREEN → commit cycle through `tdd_*` tools and `tool.execute.before` hooks.

- **How to start:** when a TDD cycle is required, begin with `tdd_start {behavior}`. Preconditions: clean git working tree (excluding `.kilo/**`), no in-progress git operation, and no active incomplete cycle.
- **Follow plugin feedback:** every `tdd_*` response and enforcement error includes `## TDD Guidance` with current state, allowed next commands, forbidden actions, and rules. Treat it as the source of truth for progressing the cycle; use `tdd_status` to re-orient.
- **Do not bypass enforcement:** do not work around hook/tool blocks via shell obfuscation, alternate tools, or unhooked paths. If blocked on legitimate work, report the limitation and wait for the user's decision.
- **Limits:** enforcement is tool-boundary only (not a provable sandbox). See `../kilo-tdd-plugin/README.md` for details.
