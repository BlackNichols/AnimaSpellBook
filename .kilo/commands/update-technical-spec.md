---
description: Update a technical spec with immediate structural validation and impact assessment
---

# Update Technical Specification

Modify an existing technical spec (decision record) in a controlled, fail-fast way. Use this instead of ad-hoc edits during implementation—especially when spec issues are found mid-chunk.

## Inputs

- **Feature state (default):** read `.kilo/feature.json` when present. Resolve technical spec path as **explicit argument > `.kilo/feature.json.technicalSpec` > ask/stop**. Report resolved source/path.
- **Technical spec path** (in `documentation/technical/decisions/` or provided/resolved). If missing/unclear, stop and ask.
- **Requested change and reason** (what must change and why; include evidence from code/findings when applicable).
- **Related artifacts:** functional spec and implementation plan (if any, resolve via feature state/refs) for impact assessment. Relevant context: `.kilo/FEATURE_STATE.md`.

## Process

1. **Load and understand**
   - Run `node scripts/check-doc.mjs --type spec <path>` to confirm the current spec is structurally valid before editing (if invalid, report issues and fix as part of this update).
   - Read the technical spec in full, plus related functional spec/plan and relevant code/tests as needed to understand the change and its impact.

2. **Assess and consult (when required)**
   - Identify affected decisions, contracts/ownership, boundaries, risks/test mapping, and validation spikes.
   - If the change alters a technical-spec decision/contract, scope, or material rationale, explain options/impact and consult the user using the `question` tool before applying. Do not make unilateral material changes.
   - Determine whether the implementation plan is impacted (chunk goals/acceptance/order, risks/coverage, dependencies).

3. **Apply the change**
   - Update the spec to reflect the agreed change. Keep ADR-style rationale (what changed, why, consequences) and update status/date/fields as appropriate.
   - **Fail-fast structural validation (required):** immediately after each modification, run `node scripts/check-doc.mjs --type spec <path>`. Fix any reported issues and rerun until it passes before continuing. Do not leave the spec in an invalid state.

4. **Assess downstream impact and handoff**
   - Report impact on the implementation plan and in-progress work. If the plan is affected, recommend/update it via `/update-plan` (do not leave spec/plan inconsistent).
   - If implementation is in progress, stop implementation work and require `/implement` to be restarted from step 1 (coherence/reflection) after spec/plan updates are complete and valid.

5. **Report**
   - If the spec path moved/renamed, update `.kilo/feature.json.technicalSpec` (and `updatedAt`) when used. Keep feature state coherent.
   - Summarize: resolved feature-state source (if used), spec path, changes made, validation result, user consultation/decisions, plan impact, and next steps (`/update-plan` if needed, then restart `/implement`). Stop after updating/reporting; do not implement.