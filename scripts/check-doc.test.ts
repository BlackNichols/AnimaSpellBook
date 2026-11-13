import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(__dirname, '..');
const script = path.join(root, 'scripts', 'check-doc.mjs');

function run(type: 'spec' | 'plan', file: string) {
  const r = spawnSync(process.execPath, [script, '--type', type, file], {
    cwd: root,
    encoding: 'utf8',
  });
  return {
    status: r.status,
    stdout: r.stdout || '',
    stderr: r.stderr || '',
  };
}

function writeTmp(name: string, content: string) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-doc-'));
  const file = path.join(dir, name);
  fs.writeFileSync(file, content, 'utf8');
  return { dir, file };
}

describe('check-doc gate', () => {
  it('accepts a valid spec with bold-colon labels (**Label:**)', () => {
    const r = run('spec', 'documentation/technical/decisions/spellbook.md');
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('OK: spec structure valid');
  });

  it('reports specific failure reasons for spec template placeholders/empties', () => {
    const r = run('spec', 'documentation/technical/decisions/TECHNICAL_SPEC_TEMPLATE.md');
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('Structural check failed for spec');
    expect(r.stderr).toContain('metadata/field "Date" placeholder date');
    expect(r.stderr).toContain('metadata/field "Functional spec" placeholder');
    expect(r.stderr).toContain('section 1 missing or invalid field: "Goal / user-visible behavior" (empty)');
    expect(r.stderr).toContain('section 1 missing or invalid field: "Unknowns / open questions" (empty)');
    expect(r.stderr).toContain('section 2 (per decision) missing or invalid field: "Consequences / tradeoffs" (empty)');
    expect(r.stderr).toContain('section 9 missing or invalid field: "Suggested slice boundaries/risks for planning (non-sequencing)" (missing)');
    expect(r.stderr).not.toContain('metadata/field "Status" missing');
  });

  it('recognizes metadata and section fields regardless of colon placement in bold', () => {
    const content = `# Technical Specification: X

- **Status:** Accepted
- **Date:** 2026-01-01
- **Functional spec:** doc.md
- **Related docs:** n/a

## 1. Context & Scope

- **Goal / user-visible behavior:** g
- **In scope:** i
- **Out of scope / non-goals:** o
- **Constraints:** c
- **Assumptions:** a
- **Unknowns / open questions:** u

## 2. Decisions (ADR-style)

### D1. One

- **Status:** Accepted
- **Context / problem:** p
- **Options considered:**
  - A: a
- **Decision:** d
- **Rationale:** r
- **Consequences / tradeoffs:** t

## 3. Technical Design & Contracts

- **State ownership & reactivity/binding model:** s
- **Single writer per concern:** w
- **Separation of concerns & responsibilities:** sep
- **Module boundaries, data flow & dependency direction:** m
- **Interfaces / contracts affected:** i
- **Boundary contracts & validation:** b

## 4. Risks & Mitigations

| Risk | Impact | Mitigation / owner | Residual risk |
|---|---|---|---|
| r | i | m | rr |

## 5. Risk → Test Mapping (traceable to functional acceptance criteria)

| Functional criterion / risk | Contract or behavior | Required layer(s) | Test focus (what must be asserted) |
|---|---|---|---|
| c | b | l | t |

## 6. Feature-Specific Invariants (if any)

| Invariant | Owner module/boundary | Assertion/guard (where enforced) | Exercised by (tests/runs) | Notes |
|---|---|---|---|---|
| i | o | a | e | n |

## 7. Validation Spikes

| Spike | Question to answer | How to verify | Outcome |
|---|---|---|---|
| s | q | h | o |

## 8. Reviewer Guidelines (for \`/assess\`)

- **Contracts to uphold:** c
- **Boundary validation to uphold:** b
- **Cross-cutting invariants to uphold:** x
- **Feature-specific invariants to uphold:** f
- **Design/quality to uphold:** d
- **Test adequacy expectations:** t
- **High-risk areas / focus:** h
- **References:** r

## 9. Handoff to Planning

- **Suggested slice boundaries/risks for planning (non-sequencing):** s
`;
    const { file } = writeTmp('spec.md', content);
    const r = run('spec', file);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('OK: spec structure valid');
  });

  it('reports specific failure reasons for plan template', () => {
    const r = run('plan', 'documentation/technical/plans/PLAN_TEMPLATE.md');
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('metadata/field "Date" placeholder date');
    expect(r.stderr).toContain('Goal & Scope missing or invalid field: "Goal" (empty)');
    expect(r.stderr).toContain('Goal & Scope missing or invalid field: "Out of scope" (empty)');
    expect(r.stderr).toContain('Change log must contain a table with at least one populated data row');
  });
});
