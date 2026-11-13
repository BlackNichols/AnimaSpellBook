---
description: Produce a chunked implementation plan from functional and technical specs
---

# Plan

Produce a strategic, chunked implementation plan from the functional spec and its technical spec. This defines *what* to deliver in which order by default; it does not prescribe detailed *how* or TDD micro-steps. Implementation executes chunks and remains autonomous on in-chunk tactics within the specs' contracts.

## Inputs

- **Feature state (default):** read `.kilo/feature.json` when present. Resolve inputs as **explicit argument > `.kilo/feature.json` > ask/stop**. Report resolved source/paths (`functionalSpec`, `technicalSpec`).
- **Functional spec** (path/text provided by the user/resolved) — source of user-visible behavior and acceptance criteria.
- **Technical spec** from `/technical-discovery` (path in `documentation/technical/decisions/` or provided/resolved) — source of decisions/rationale, contracts/ownership, boundaries, risks, risk→test mapping, and validation spikes. Read it fully.
- Relevant context: `AGENTS.md`, `documentation/technical/TESTING.md`, `.kilo/FEATURE_STATE.md`, and related docs.

If a required spec is missing or ambiguous for a non-trivial/cross-cutting/user-visible change, stop and recommend running `/technical-discovery` (or clarify inputs) before planning.

## Planning principles

- **Vertical, end-to-end slices:** each chunk must be independently valuable and verifiable (integratable), delivering a coherent user-visible/functional increment—not a horizontal layer or big-bang wiring. Avoid chunks that cannot be validated on their own.
- **Strategic, not prescriptive:** define functional perimeter, acceptance criteria, dependencies, and notable risks per chunk. Keep technical/how detail minimal and defer to the technical spec (contracts, ownership, boundaries, risk→test mapping). Do not specify TDD iterations or low-level implementation steps.
- **Traceable:** acceptance criteria must be traceable to the functional spec and respect technical-spec decisions/contracts and required test coverage.
- **Ordered, but a default:** chunk order is the recommended sequence, not a straitjacket.

## Process

1. **Understand scope**
   - Read functional and technical specs. Identify goals, in/out of scope, acceptance criteria, key contracts/risks, and validation spikes that affect sequencing or chunk boundaries.
   - If material scope/contract ambiguities remain, resolve them with the user (use `question`) before finalizing; do not guess.

2. **Define chunks**
   - Split the work into small, vertical slices. For each chunk capture: goal/functional perimeter, acceptance criteria (traceable to functional spec), dependencies, notable risks/contracts to honor (referencing the technical spec), and status (`todo`/`in_progress`/`done`/`blocked`).
   - Sequence chunks so high-risk contracts/spikes and integration points are exercised early where practical, and each chunk can be verified in isolation at its boundary.
   - Keep chunks small enough to complete and gate independently; split oversized chunks.

3. **Write the plan artifact**
   - Write to `documentation/technical/plans/` (kebab-case name derived from the feature/topic) unless the user specifies a path. Use `documentation/technical/plans/PLAN_TEMPLATE.md`.
   - The plan MUST state: source specs, chunk list with per-chunk acceptance criteria/dependencies/risks/status, the default order, per-chunk verification expectations, and the plan modification rules below.
   - **Structural gate (required):** run `node scripts/check-doc.mjs --type plan <path>` on the written plan. Fix any reported issues and rerun until it passes before reporting. A plan that fails structural validation is not complete.
   - **Update feature state:** if `.kilo/feature.json` exists (or the feature context is being established), set/update `feature` (when known), `functionalSpec`, `technicalSpec`, `plan` (written path), `activeChunk` (first chunk/default, when clear), `status: "planned"`, and `updatedAt` (ISO-8601). Preserve unrelated fields.

4. **Report**
   - Summarize: resolved feature-state source/paths (if used), plan path, chunk outline (order and goals), key risks/spikes to watch, `.kilo/feature.json` updates (if any), and that implementation proceeds chunk-by-chunk with per-chunk `/verify` (and `/assess` when non-trivial). Stop after producing the plan; do not implement.

## Implementation & plan evolution (guidance for executing the plan)

- **Per-chunk gate:** complete each chunk with its acceptance criteria satisfied, then run `/verify` for that chunk's scope (and `/assess` for non-trivial work) before moving on. Do not defer integration to a big-bang finish. Use `/fix` (reopen/trace) for user-reported bugs or review findings on done chunks rather than ad-hoc edits.
- **Autonomous within a chunk:** the implementing agent chooses TDD iterations and tactical/how details (optional lightweight subplan/notes are fine) as long as they stay within chunk acceptance criteria and technical-spec contracts/boundaries. Do not override the tech spec.
- **Plan modification (living but traceable):** update chunk status and record rationale for meaningful changes in the plan's change log.
  - **Autonomous (no user approval):** reorder upcoming chunks, split/merge chunks, adjust internal approach, or mark a step irrelevant based on findings—*only if* functional scope/acceptance criteria and technical-spec decisions/contracts are preserved.
  - **Consult the user first:** dropping/deferring a chunk or requirement, changing functional scope or acceptance criteria, major reprioritization, or deviating from a technical-spec decision/contract. Use `question` and record the outcome.