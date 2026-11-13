---
description: Run the Definition of Done verification gate and report results
---

# Verify (Definition of Done)

Run the project's verification gate before claiming completion. Follow AGENTS.md "Definition of Done (Verification Gate)". This workflow is objective/automated; use `/assess` for qualitative assessment of test adequacy and architectural risks. For user-reported bugs or review findings, fixes are handled via `/fix` and must be re-verified through this gate.

1. **Classify changes**
   - Inspect `git status --short` and `git diff --name-only` (and staged/untracked as relevant) for uncommitted work.
   - **Committed-work scope:** if relevant work is already committed (working tree clean or incomplete relative to the work under verification), determine scope from commits after the last **spec-only commit**. A spec-only commit is a commit whose changed files are exclusively implementation plan and/or technical spec docs (paths under `documentation/technical/plans/` and/or `documentation/technical/decisions/`). Find it by checking recent history (e.g. `git log --name-only --format='---%H' -n 30`) and selecting the most recent commit where every changed file is under those paths. Use that commit as the baseline and inspect `git diff --name-status <spec-only>..HEAD`, `git diff --stat <spec-only>..HEAD`, and `git log --oneline <spec-only>..HEAD`. If no such baseline exists, fall back to the commits comprising the work under verification (state the range used). Always include any uncommitted changes in scope.
   - Determine: code/config/runtime, UI/view/flow/routing/URL/navigation/asset/base/serving, and/or docs-only.

2. **Run required checks (stop on first failure)**
   - For code/config/runtime changes: run `npm run lint`, `npm test -- --run`, and `npm run build`.
   - For UI/view/flow/routing/URL/navigation/asset/base/serving changes: run all of the above plus `npm run e2e`. Deep-link/refresh/SPA-fallback and asset/base behavior on nested routes (e.g. `/spellbooks/:id`) must be covered by automated E2E tests—do not substitute manual checks. If `npm run e2e` cannot run (e.g. browsers not installed/environment unavailable), state why explicitly and treat the gate as incomplete.
   - For docs/non-runtime-only changes: state what was checked; run lint/test/build if they could be affected.

3. **Report**
   - Provide a concise summary: scope/baseline used (uncommitted and/or commits after spec-only commit, or fallback range), change category, each command/check run, pass/fail (with key failure output if any), and any skipped check with explicit reason.
   - Do not claim completion unless all required checks for the change type have passed (or skips are explicitly justified per AGENTS.md). If a check fails, fix and rerun the full required gate.
