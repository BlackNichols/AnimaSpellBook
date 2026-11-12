---
description: Implement a plan chunk with spec/plan coherence checks, TDD, and per-chunk verification
---

# Implement

Execute implementation work against an existing plan and its specs. This workflow anchors implementation to explicit contracts and a living plan: load context, reflect on coherence before coding, deliver one vertical chunk end-to-end, and gate each chunk. It does not replace the TDD plugin or `/verify`/`/review`.

## Inputs

- **Implementation plan** (path in `documentation/technical/plans/` or provided by the user). If none exists for non-trivial/cross-cutting/user-visible work, stop and recommend `/plan`.
- **Technical spec** and **functional spec** referenced by the plan (in `documentation/technical/decisions/` and `documentation/specifications/`). If missing, stop and recommend `/technical-discovery`/`/plan`.
- Relevant context: `AGENTS.md`, `documentation/technical/TESTING.md`, and affected source/docs.

## Process

1. **Load context**
   - **Validate targets first (required):** identify the referenced technical spec, functional spec, and implementation plan. Run `node scripts/check-doc.mjs --type spec <tech-spec-path>` and `node scripts/check-doc.mjs --type plan <plan-path>`. If either fails, report the errors and stop—do not read or use an invalid spec/plan. If a functional spec path is missing/invalid and required, report it.
   - Read the plan, technical spec, and functional spec in full (only after validation passes). Note contracts/ownership, boundaries, risk→test mapping, validation spikes, applicable cross-cutting invariants (`documentation/technical/INVARIANTS.md`), feature-specific invariants, and chunk acceptance criteria.
   - Read the current code and existing tests relevant to the target chunk (and recent git state) to understand the actual baseline.

2. **Reflect and check coherence (before coding)**
   - Assess: are the functional/technical specs still up to date and relevant given the current code and findings? Is the plan still coherent (chunk goals/acceptance, order/dependencies, risks, and status) with the specs and reality?
   - Look for contradictions, stale assumptions, completed/invalidated steps, missing coverage of known risks, or spec/plan drift from the codebase.
   - **Verify scope fit:** confirm planned work for the target chunk is within the chunk’s functional perimeter and the technical spec’s boundaries/ownership (module/layer responsibilities, single writer per concern, dependency direction). Flag work that would require cross-boundary changes, out-of-scope behavior, or spec deviations.
   - **If issues are found:** report findings clearly (what is stale/incoherent or out of scope/boundary, evidence/impact, and options). Identify the appropriate update path: use `/update-technical-spec` if the technical spec/decisions/contracts must change (then `/update-plan` if impacted), or `/update-plan` for plan-only issues (respecting modification rules). Stop the `/implement` workflow—do not start implementation; after updates are validated, restart `/implement` from step 1.
   - **If coherent:** state briefly that specs/plan align with the current code and the target chunk’s scope/boundaries, then proceed.

3. **Select and scope one chunk**
   - Choose the next chunk to work on (default plan order) and confirm its functional perimeter, acceptance criteria, dependencies, and required contracts/coverage.
   - Work on one chunk at a time. Do not combine chunks into big-bang changes.
   - If chunking/order/approach should change, follow plan modification rules (below) before or as you adjust.

4. **Implement the chunk (vertical, contract-first)**
   - Deliver the chunk end-to-end and integratably within the chunk’s acceptance criteria and the technical spec’s contracts/boundaries (state ownership/reactivity, single writer per concern, separation of concerns, dependency direction). Do not deviate from technical-spec decisions.
   - **Stay within scope/boundaries:** keep changes confined to the chunk’s functional perimeter and required integration points, and within the technical spec’s module boundaries and ownership. If correct implementation requires out-of-scope, cross-boundary, or spec-deviating changes, stop and follow plan modification/consultation rules (do not silently expand scope).
   - **Integration/contract-first:** for user-visible behavior, add/extend failing integration or E2E tests that assert rendered contracts/outcomes before wiring UI (per `documentation/technical/TESTING.md`). TDD iterations and tactical/how details (and any lightweight subplan/notes) are chosen autonomously within the chunk and specs.
   - **Boundary contracts (when specified by the tech spec):** implement typed interfaces/shapes for affected boundaries and runtime parse/validate at untrusted/serialized edges (URL decode, localStorage restore, JSON import/export payloads) returning a typed result or clear error with no partial/corrupt state; keep trusted internal calls typed. Add mapped boundary tests (parse/validate/round-trip, invalid/edge/error cases) before wiring. Do not trust raw `JSON.parse`/params/storage at those edges.
   - **Invariants (cross-cutting and feature-specific):** implement/maintain applicable cross-cutting invariants from `documentation/technical/INVARIANTS.md` and any feature-specific invariants from the technical spec as cheap assertions/guards at their owning modules/boundaries. They must fail fast in dev/test and be exercised by unit/integration/E2E runs; add or ensure tests cover paths that trigger them. If a feature-specific invariant is or becomes cross-cutting, promote it to `INVARIANTS.md` (and record the change per spec/plan update rules).
   - **Git-backed TDD cycle (plugin-enforced; follow when applicable):**
     1. `tdd_start {behavior}` — start a cycle. Requires a clean working tree (excluding `.kilo/**`), no in-progress git operation, and an appropriate branch; records base SHA/branch.
     2. Write the failing test and run it. `tdd_commit_red {command, testFiles?}` — independently runs/verifies the failing test(s), stages/commits only relevant test files, and records the RED baseline (protected test hashes). Pass `testFiles` for attribution/scoping when useful.
     3. Implement production code. `tdd_verify_green {command, testFiles?}` — verifies protected tests are unchanged and independently runs/verifies GREEN.
     4. `tdd_commit_green {refactor: "yes"|"no", notes?}` — commits verified implementation files (protected/non-allowed test/config changes are rejected by scope policy).
     5. `tdd_finish` — generates the cycle report and clears the active cycle (returns to IDLE).
     - **Test correction:** if the RED test is wrong during implementation, `tdd_revert_implementation` (restores tracked implementation to RED, removes untracked implementation files by explicit paths), fix the test, run it to confirm RED, then `tdd_amend_red {command, testFiles?}` to re-verify RED and amend the RED commit (refreshes protected baseline).
   - **No ad-hoc spec/plan edits mid-loop (fail-fast):** do not modify the technical spec or implementation plan during chunk/TDD work. If a spec issue is found, stop and use `/update-technical-spec` (then `/update-plan` if impacted), then restart `/implement` from step 1. If a plan change beyond routine end-of-chunk bookkeeping is needed, stop and use `/update-plan` (respecting modification rules) and restart `/implement` as appropriate. After any spec/plan modification, structural validation must be run immediately and pass before continuing (fail-fast).
   - Respect plugin constraints and do not bypass enforcement (see `AGENTS.md`). If the plugin blocks legitimate work, report the issue/limitation and wait for the user's decision.

5. **Gate and record the chunk**
   - **Self-check scope:** confirm the diff stays within the chunk’s functional perimeter and the technical spec’s boundaries/ownership; resolve or consult/record any necessary deviation per plan rules before gating.
   - When the chunk’s acceptance criteria are satisfied, run `/verify` for the chunk’s scope.
   - **Independent review (blocking, non-trivial chunks):** delegate to the read-only `reviewer` subagent via the `task` tool (`subagent_type: "reviewer"`). Provide the technical/functional spec paths, plan path and active chunk, and change context (e.g. `git diff --stat`, `git diff`, changed files). Require it to assess spec + plan chunk + diff against the risk→test mapping and return an explicit contract/acceptance checklist with evidence and blocking/advisory findings. Treat any blocking finding as must-fix; fix and rerun `/verify` and independent review as needed before proceeding.
   - **Record in plan (immediate validation):** update the plan chunk status and add a change log entry for meaningful changes (what changed, rationale, whether the user was consulted). Immediately run `node scripts/check-doc.mjs --type plan <plan-path>`, fix any structural errors, and rerun until it passes before reporting. Do not proceed with invalid plan artifacts.

6. **Report**
   - Summarize: chunk worked, coherence/reflection outcome, implementation and test changes, `/verify` and `/review` results, plan updates, and open items/risks. Do not claim completion unless the required gate passed per `AGENTS.md`.

## Plan modification rules (traceable)

- **Autonomous (record rationale in plan change log):** reorder upcoming chunks, split/merge, adjust internal approach, or mark a step irrelevant based on findings—only if functional scope/acceptance criteria and technical-spec decisions/contracts are preserved.
- **Consult the user first (use `question`, record outcome):** drop/defer a chunk or requirement, change functional scope or acceptance criteria, major reprioritization, or deviate from a technical-spec decision/contract. Apply such changes via `/update-plan` (and `/update-technical-spec` when spec decisions/contracts change), not ad-hoc during `/implement`. If coherence/spec issues are found in step 2, stop `/implement` and route to the appropriate update workflow.