---
description: Assess changes for test adequacy/coherence and architectural/contract risks
---

# Assess (Test & Architecture)

Perform a qualitative assessment of the current changes. Complements `/verify` (objective pass/fail) and the TDD plugin (red/green mechanics). Use `documentation/technical/TESTING.md` as the testing strategy/reference (layers, required coverage, conventions). Do not claim completion on the basis of this assessment alone.

1. **Gather context**
   - Read `documentation/technical/TESTING.md`, `documentation/technical/INVARIANTS.md`, and `AGENTS.md` (Definition of Done) for required coverage, invariants, and gates.
   - **Resolve feature state (default):** read `.kilo/feature.json` when present. Resolve inputs as **explicit argument > `.kilo/feature.json` > ask/stop** for plan/technical/functional specs and `activeChunk` hint; report resolved source/paths.
   - If an implementation plan applies (resolved path or `documentation/technical/plans/`), read it for the active chunk’s functional perimeter, acceptance criteria, status, recorded deviations, and any recorded fixes/findings.
   - If a technical spec/decision record applies to the change (resolved path or `documentation/technical/decisions/`), read it and use its contracts (ownership/single-writer, module boundaries/responsibilities, dependency direction), boundary contracts & validation, risk→test mapping, feature-specific invariants, and reviewer guidelines.
   - Inspect `git status --short`, `git diff --stat`, and `git diff` (plus staged/untracked as relevant) for uncommitted work.
   - **Committed-work scope:** if the work under assessment is already committed (working tree clean or not reflective of the changes), assess commits after the last **spec-only commit**. A spec-only commit is a commit whose changed files are exclusively implementation plan and/or technical spec docs (paths under `documentation/technical/plans/` and/or `documentation/technical/decisions/`). Find it by checking recent history (e.g. `git log --name-only --format='---%H' -n 30`) and selecting the most recent commit where every changed file is under those paths. Use that commit as the baseline and inspect `git diff --name-status <spec-only>..HEAD`, `git diff --stat <spec-only>..HEAD`, and `git diff <spec-only>..HEAD` (and `git log --oneline <spec-only>..HEAD`). If no such baseline exists, fall back to the commits comprising the work under assessment (state the range used). Always include any uncommitted changes in scope.
   - Identify production changes, test changes, and config/build/serving changes, and relate them to the chunk scope and spec boundaries. State the scope/baseline used.

2. **Test adequacy & coherence** (per `documentation/technical/TESTING.md`)
   - Are added/changed tests coherent with the production behavior and sufficient for the risk, at the right layer (unit, integration/UI binding, E2E)?
   - For user-visible behavior (UI controls/bindings, routing/navigation, URL↔UI↔results sync, view switching, deep links/refresh, SPA fallback, asset/base on nested routes), is there integration/E2E coverage asserting rendered outcomes and contracts (not just unit tests or internal state)? Missing automated deep-link/refresh/asset-base coverage for affected routing/serving changes is a gap.
   - **Boundary contracts (per technical spec, when applicable):** are specified boundaries covered with mapped tests for parse/validate/round-trip and invalid/edge/error cases, asserting typed results and no partial/corrupt state at untrusted/serialized edges (URL decode, localStorage restore, JSON import/export)?
   - Do tests pin critical contracts (e.g. state/reactivity updates drive DOM, single writer per concern, path-scoped URL sync)? Do regression tests fail for the reported issue (RED/GREEN) when applicable?
   - Note weak, brittle, or missing cases (edge cases, error paths, cold-load/refresh, nested-route asset resolution). Prefer assertions on user-visible outcomes over implementation details.

3. **Architecture, design quality & implementation risks**
   - **Scope & ownership adherence (spec-grounded):** compare the diff to the active chunk’s functional perimeter/acceptance criteria and the technical spec’s boundaries and ownership. Flag as **blocking**: changes outside the chunk’s scope or required integration, cross-boundary violations (module/layer responsibilities, dependency direction), additional/competing writers for URL/view/store, or behavior not covered by the specs/plan without a recorded, approved deviation. Allowed plan modifications must follow the plan’s rules and be recorded.
   - **Boundary contracts & validation (spec-grounded, when applicable):** flag as **blocking** missing runtime parse/validate at specified untrusted/serialized edges (URL decode, localStorage restore, JSON import/export), unsafe raw-data use at those edges (e.g. trusting unvalidated `JSON.parse`/params/storage), lack of typed boundary shapes/interfaces, or missing mapped boundary/round-trip/error tests. Validated paths must return a typed result or clear error with no partial/corrupt state.
   - **Invariants (spec-grounded):** check applicable cross-cutting invariants from `documentation/technical/INVARIANTS.md` and feature-specific invariants from the technical spec. Verify they exist as cheap guards/assertions at the owning modules/boundaries and are exercised by tests/runs (dev/unit/integration/E2E as applicable). Flag as **blocking** missing, unowned, or unexercised invariants with evidence. If a feature-specific invariant is cross-cutting, note promotion to `INVARIANTS.md`.
   - Separation of concerns & ownership: single writer per concern (URL, view state, store), clear module/layer responsibilities, no mixed concerns or ambiguous shared mutable state.
   - Boundaries & dependencies: high cohesion/low coupling, explicit dependency direction, no hidden coupling; changes stay local and testable.
   - Code quality & maintainability: simplicity and readability, avoid unnecessary complexity/duplication, clear contracts/interfaces and error-handling boundaries.
   - Reactivity/binding correctness: state exposed in a way the UI framework tracks; view updates on state/route changes.
   - Cross-cutting coupling and big-bang risk: prefer vertical slices; flag compounded, hard-to-isolate changes.
   - Serving/deploy concerns: SPA fallback and asset/base behavior for nested paths in dev/build/preview contexts as relevant.

4. **Report**
   - Summarize: resolved feature-state source/paths and active chunk (if used), scope/baseline reviewed, strengths, gaps/risks (with file/area references), and concrete recommended fixes or tests to add.
   - Classify findings as **blocking** (must address before completion) vs **advisory**, covering test adequacy, contract adherence, and design quality/maintainability concerns.
   - For each finding give a stable identifier (e.g. `F1`, `F2`), severity, affected file/area, the required fix/test, and traceability to the relevant chunk/spec/contract when applicable.
   - **Disposition:** blocking findings must be resolved (fix in-chunk before marking done, or via `/fix` when found on done/reopened work) and re-gated with `/verify` and independent review. Advisory findings should be triaged: fix now, schedule/record as a planned fix item, or explicitly accept with rationale recorded in the plan change log (consult the user if acceptance affects scope or risk). Do not claim the work is complete while blocking findings remain.
