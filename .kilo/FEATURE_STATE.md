# Feature state (`.kilo/feature.json`)

Centralizes the current feature/spec/plan context so workflow commands do not require repeating paths.

## Schema (repo-relative paths)

```json
{
  "feature": "<slug or name>",
  "functionalSpec": "documentation/specifications/<name>.md",
  "technicalSpec": "documentation/technical/decisions/<name>.md",
  "plan": "documentation/technical/plans/<name>.md",
  "activeChunk": "<chunk id>",
  "status": "discovery|planned|implementing|fixing|verifying|done|blocked|null",
  "updatedAt": "<ISO-8601>"
}
```

## Rules

- **Resolution:** explicit user/command argument > `.kilo/feature.json` > ask/stop if required. Commands must report the resolved source and paths.
- **Validation (fail-fast):** resolved spec/plan paths must pass `node scripts/check-doc.mjs --type spec|plan <path>` before use, per existing command/AGENTS rules.
- **Updates:** producing workflows (`/technical-discovery`, `/plan`) populate/update relevant fields; execution workflows (`/implement`, `/fix`) keep `activeChunk`/`status`/`updatedAt` current; `/update-technical-spec` and `/update-plan` keep paths coherent when artifacts move/rename.
- **Lifecycle:** clear or replace the file when switching features to avoid stale context. One active feature per workspace by default (override with explicit args).
- **Not authority:** this file is convenience context only; it does not grant permission, change scope, or replace spec/plan content.
