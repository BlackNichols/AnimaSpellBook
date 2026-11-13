---
description: Run technical discovery on a functional spec to identify risks, decide solutions, and produce a technical spec/ADR
---

# Technical Discovery

Analyze a functional specification, identify what could go wrong, discuss solutions with the user, and produce a technical specification that records decisions and rationale. This is a conception/design step; it does not produce an implementation plan or task sequencing (a separate `/plan` step will do that).

## Inputs

- Functional spec (path or text provided by the user). Read it fully before proceeding.
- Relevant context: `AGENTS.md`, `documentation/technical/TESTING.md`, `documentation/technical/INVARIANTS.md` (cross-cutting invariants), and any related docs in `documentation/technical/` or `documentation/specifications/`.

## Process

1. **Understand scope and context**
   - Summarize the functional goal, user-visible behaviors, affected areas, and constraints/non-goals.
   - Note assumptions and unknowns that affect feasibility or correctness.

2. **Identify material risks and decision points**
   - What could go wrong technically or erode design quality: correctness, state/reactivity and view binding; **separation of concerns** and ownership (unclear responsibilities, mixed concerns, multiple writers, hidden coupling); module boundaries, cohesion/coupling, data flow, and dependency direction; API/contract clarity; **boundary contracts** (URL/search params↔app/router state, route/path params↔view/state, localStorage persistence↔domain, JSON import/export↔domain, module/store interfaces) including parse/validate/round-trip and error behavior at untrusted/serialized edges; complexity, duplication, readability, and maintainability; data/URL contracts, routing/navigation, deep-link/refresh and SPA fallback/asset-base on nested routes; performance, security, migration/compatibility, testability, and error-handling boundaries.
   - Favor designs with clear responsibilities, high cohesion/low coupling, explicit dependencies, simple/testable boundaries, and explicit typed+validated contracts at untrusted/serialized edges (fail fast, no partial/corrupt state); flag big-bang or cross-cutting changes that hinder isolation.
   - Focus on risks that materially affect architecture, contracts, maintainability, or user-visible behavior. Trivial/low-impact points may be batched or noted briefly.
   - For each material point, prepare: the risk/problem, why it matters (impact), and 1–2 concrete options with tradeoffs and a recommended option (note quality/maintainability implications).

3. **Discuss with the user, one material point at a time**
   - Present each point with options, tradeoffs, and recommendation. Use the `question` tool to get the user's decision when a choice is needed.
   - Do not resolve material ambiguities or design choices unilaterally—capture the user's decision and rationale.
   - Call out any **validation spikes**: assumptions or environment/serving behaviors that must be proven before committing (e.g. dev/preview SPA fallback, asset/base resolution on nested routes). Do not treat unproven spikes as settled decisions.

4. **Produce the technical specification**
   - Write the spec to `documentation/technical/decisions/` (kebab-case name derived from the feature/topic) unless the user specifies a path. Use the template at `documentation/technical/decisions/TECHNICAL_SPEC_TEMPLATE.md`.
   - The spec MUST include:
     - **Context & scope:** functional goal, in/out of scope, constraints, assumptions, and unknowns.
     - **Decisions (ADR-like):** for each material decision—context/problem, options considered, chosen solution, rationale, consequences/tradeoffs, and status. Record why decisions were taken so implementation can challenge the spec with context.
     - **Technical design/contracts:** explicit state ownership and reactivity/binding model; single writer per concern (URL, view state, store); separation of concerns with clear module/layer responsibilities and cohesion; module boundaries, data flow, and dependency direction; affected interfaces/contracts; boundary contracts & validation (typed shapes; runtime parse/validate at untrusted/serialized edges—URL decode, localStorage restore, JSON import—with typed result or clear error and no partial/corrupt state; round-trip/parse and error behavior); code quality/maintainability considerations (simplicity, complexity/duplication, testability).
     - **Risks & mitigations:** residual risks and how they are mitigated or monitored.
     - **Risk → test mapping:** for each risk/contract, the required automated coverage (unit vs integration/UI-binding vs E2E), traceable to functional acceptance criteria. Include user-visible contracts (routing↔rendered view, URL↔UI↔results, deep-link/refresh, SPA fallback/asset-base) and, when affected, boundary contracts (parse/validate/round-trip/error and no-partial-state behavior at untrusted/serialized edges) per `documentation/technical/TESTING.md`. Reference applicable cross-cutting invariants from `documentation/technical/INVARIANTS.md` and include coverage for them where relevant.
     - **Feature-specific invariants (if any):** invariants specific to this feature (owner module/boundary, guard/assertion location, exercised by tests/runs). State "none identified" with rationale if none. If a feature-specific invariant is or becomes cross-cutting, promote it to `documentation/technical/INVARIANTS.md`.
     - **Validation spikes:** items to prove before/early in implementation, with how to verify them.
     - **Reviewer guidelines:** what `/assess` should verify for this change (contract adherence, boundary validation, applicable cross-cutting invariants from `documentation/technical/INVARIANTS.md` and feature-specific invariants present at owners and exercised, test adequacy at the right layer, ownership/boundaries, high-risk areas). Reference `documentation/technical/INVARIANTS.md`, `documentation/technical/TESTING.md`, and `AGENTS.md`.
     - **Handoff to planning:** note that `/plan` consumes this spec to produce vertical-slice sequencing and per-slice Definition of Done. Discovery may flag slice boundaries/risks but must not prescribe task sequencing or TDD micro-steps.
   - **Structural gate (required):** run `node scripts/check-doc.mjs --type spec <path>` on the written spec. Fix any reported issues and rerun until it passes before reporting. A spec that fails structural validation is not complete.

5. **Report**
   - Summarize: spec path, key decisions taken, open assumptions/spikes, and notable risks/test expectations. Stop after producing the spec; do not implement.