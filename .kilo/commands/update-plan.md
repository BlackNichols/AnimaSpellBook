---
description: Update an implementation plan with immediate structural validation and traceability
---

# Update Implementation Plan

Modify an existing implementation plan in a controlled, fail-fast way. Use this for plan changes outside routine end-of-chunk bookkeeping, and whenever a spec change impacts the plan.

## Inputs

- **Feature state (default):** read `.kilo/feature.json` when present. Resolve plan path as **explicit argument > `.kilo/feature.json.plan` > ask/stop**. Report resolved source/path.
- **Plan path** (in `documentation/technical/plans/` or provided/resolved). If missing/unclear, stop and ask.
- **Requested change and reason** (what must change and why; include evidence/findings).
- **Related artifacts:** referenced technical spec and functional spec for coherence/impact (resolve via plan/feature state). Relevant context: `.kilo/FEATURE_STATE.md`.

## Process

1. **Load and validate context**
   - Run `node scripts/check-doc.mjs --type plan <path>` to confirm the current plan is structurally valid before editing (if invalid, report issues and fix as part of this update).
   - Read the plan and its referenced technical/functional specs. If the referenced technical spec exists, run `node scripts/check-doc.mjs --type spec <tech-spec-path>` and report if it is invalid (spec must be fixed via `/update-technical-spec` before aligning the plan to it).
   - Understand the requested change, affected chunks/acceptance criteria/dependencies, and impact.

2. **Assess and consult per modification rules**
   - **Autonomous (record rationale in change log):** reorder upcoming chunks, split/merge, adjust internal approach, or mark a step irrelevant based on findings—only if functional scope/acceptance criteria and technical-spec decisions/contracts are preserved.
   - **Consult user first (use `question`, record outcome):** drop/defer a chunk or requirement, change functional scope or acceptance criteria, major reprioritization, or deviate from a technical-spec decision/contract.
   - If the plan cannot remain consistent with the (valid) technical/functional specs, report the inconsistency and stop for arbitration (`/update-technical-spec` and/or user decision) rather than guessing.

3. **Apply the change**
   - Update chunks, status, ordering, risks/dependencies, and other affected sections while keeping traceability to specs.
   - Update the change log with date, change, rationale, and whether the user was consulted.
   - **Fail-fast structural validation (required):** immediately after each modification, run `node scripts/check-doc.mjs --type plan <path>`. Fix any reported issues and rerun until it passes before continuing. Do not leave the plan in an invalid state.

4. **Report and handoff**
   - If the plan path moved/renamed, update `.kilo/feature.json.plan` (and `updatedAt`) when used. Keep feature state coherent with the plan.
   - Summarize: resolved feature-state source (if used), plan path, changes made, validation result, user consultation/decisions, and impact on remaining chunks/implementation.
   - If implementation is in progress, recommend restarting `/implement` from step 1 (coherence/reflection/target validation) so work proceeds against the updated, valid plan. Stop after updating/reporting; do not implement.