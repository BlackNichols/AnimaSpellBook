# Technical Specification: <Feature/Topic>

- **Status:** Draft | Accepted | Superseded
- **Date:** YYYY-MM-DD
- **Functional spec:** <path or link>
- **Related docs:** <paths>

## 1. Context & Scope

- **Goal / user-visible behavior:** 
- **In scope:** 
- **Out of scope / non-goals:** 
- **Constraints:** 
- **Assumptions:** 
- **Unknowns / open questions:** 

## 2. Decisions (ADR-style)

Record material decisions so implementation and review have rationale and can challenge the spec with context.

### D1. <Decision title>

- **Status:** Proposed | Accepted | Rejected | Superseded
- **Context / problem:** 
- **Options considered:**
  - A: <option> — pros/cons/tradeoffs
  - B: <option> — pros/cons/tradeoffs
- **Decision:** 
- **Rationale:** 
- **Consequences / tradeoffs:** 

<!-- Repeat per material decision -->

## 3. Technical Design & Contracts

- **State ownership & reactivity/binding model:** (how state is held, how the UI tracks/updates it)
- **Single writer per concern:** (who owns URL, view state, store; how they interact without loops/clobbering)
- **Separation of concerns & responsibilities:** (module/layer responsibilities, what each owns/does not own, keeping concerns isolated)
- **Module boundaries, data flow & dependency direction:** (boundaries, cohesion/coupling, explicit dependencies, how data/events flow)
- **Interfaces / contracts affected:** (routes, data shapes, events, URL params, persistence)
- **Boundary contracts & validation:** (identify boundaries: URL/search params↔app/router state, route/path params↔view/state, localStorage persistence↔domain, JSON import/export↔domain, module/store interfaces as applicable. For each: typed shapes/interfaces; runtime parse/validate at untrusted/serialized edges—URL decode, localStorage restore, JSON import—with typed result or clear error and no partial/corrupt state; trusted internal calls typed; round-trip/parse and error behavior. State "none beyond typed internal interfaces" if no untrusted/serialized boundaries apply.)
- **Code quality & maintainability:** (simplicity, complexity/duplication, readability, testability, extension points) as applicable
- **Serving / build considerations:** (SPA fallback, asset/base paths, nested routes, dev vs build/preview) as applicable

## 4. Risks & Mitigations

| Risk | Impact | Mitigation / owner | Residual risk |
|---|---|---|---|
|  |  |  |  |

## 5. Risk → Test Mapping (traceable to functional acceptance criteria)

Map each risk/contract to required automated coverage per `documentation/technical/TESTING.md` (unit, integration/UI-binding, E2E). Prefer integration/E2E for user-visible contracts.

| Functional criterion / risk | Contract or behavior | Required layer(s) | Test focus (what must be asserted) |
|---|---|---|---|
|  |  |  |  |

Include, when affected: routing↔rendered view, URL↔UI↔results sync, deep-link/refresh, SPA fallback/asset-base on nested routes, and applicable cross-cutting invariants from `documentation/technical/INVARIANTS.md`.

## 6. Feature-Specific Invariants (if any)

Feature-specific invariants that do not belong in the cross-cutting list. If an invariant becomes cross-cutting, promote it to `documentation/technical/INVARIANTS.md`.

| Invariant | Owner module/boundary | Assertion/guard (where enforced) | Exercised by (tests/runs) | Notes |
|---|---|---|---|---|
|  |  |  |  |  |

## 7. Validation Spikes

Assumptions/behaviors to prove before or early in implementation (do not treat as settled).

| Spike | Question to answer | How to verify | Outcome |
|---|---|---|---|
|  |  |  |  |

## 8. Reviewer Guidelines (for `/assess`)

- **Contracts to uphold:** (ownership, reactivity/binding, single-writer rules, boundaries from this spec)
- **Boundary validation to uphold:** (typed boundary shapes; runtime parse/validate at specified untrusted/serialized edges with typed result or clear error and no partial/corrupt state; no unsafe raw-data use at those edges; mapped boundary/round-trip/error tests present)
- **Cross-cutting invariants to uphold:** (check applicable items in `documentation/technical/INVARIANTS.md` are implemented as cheap guards at owners and exercised by tests/runs)
- **Feature-specific invariants to uphold:** (check section 6 items are implemented at owners and exercised by tests/runs, or promoted to `documentation/technical/INVARIANTS.md` if cross-cutting)
- **Design/quality to uphold:** (separation of concerns, cohesion/coupling, dependency direction, simplicity and maintainability per this spec)
- **Test adequacy expectations:** (required layers/coverage and critical cases per sections 5–7; missing automated coverage for affected user-visible/routing/serving behavior is blocking)
- **High-risk areas / focus:** 
- **References:** `documentation/technical/INVARIANTS.md`, `documentation/technical/TESTING.md`, `AGENTS.md` (DoD), this spec

## 9. Handoff to Planning

- `/plan` consumes this spec to produce vertical-slice sequencing and per-slice Definition of Done (functional perimeter and acceptance criteria; minimal technical/how detail).
- Suggested slice boundaries/risks for planning (non-sequencing): 
