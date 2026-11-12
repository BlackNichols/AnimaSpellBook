#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
let type = null;
let file = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--type' && args[i + 1]) { type = args[++i]; continue; }
  if (!args[i].startsWith('-') && !file) { file = args[i]; continue; }
}

function fail(msgs) {
  const list = Array.isArray(msgs) ? msgs : [msgs];
  for (const m of list) console.error(`- ${m}`);
  process.exit(1);
}

if (!type || !['spec', 'plan'].includes(type) || !file) {
  console.error('Usage: node scripts/check-doc.mjs --type <spec|plan> <file>');
  process.exit(2);
}

const resolved = path.resolve(file);
if (!fs.existsSync(resolved)) fail(`file not found: ${file}`);
const text = fs.readFileSync(resolved, 'utf8');
const lines = text.split(/\r?\n/);

const errors = [];

function hasHeading(re) { return lines.some(l => re.test(l)); }
function findLineIndex(re) { return lines.findIndex(l => re.test(l)); }
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function valueAfterLabel(label, { allowNA = false } = {}) {
  const re = new RegExp(`^\\s*-\\s*\\*\\*${escapeRe(label)}\\*\\*\\s*:?(.*)$`);
  for (const l of lines) {
    const m = l.match(re);
    if (m) {
      let v = (m[1] || '').trim();
      if (!v) return { ok: false, value: v, reason: 'empty' };
      if (/^<[^>]+>$/.test(v)) return { ok: false, value: v, reason: 'placeholder' };
      if (/^YYYY-MM-DD$/i.test(v)) return { ok: false, value: v, reason: 'placeholder date' };
      if (!allowNA && /^(tbd|todo|n\/a|none|\?\??)$/i.test(v)) return { ok: false, value: v, reason: 'unresolved placeholder' };
      return { ok: true, value: v };
    }
  }
  return { ok: false, value: '', reason: 'missing' };
}

function requireLabel(label, opts) {
  const r = valueAfterLabel(label, opts);
  if (!r.ok) errors.push(`metadata/field "${label}" ${r.reason}${r.reason === 'missing' ? '' : ` (value: ${JSON.stringify(r.value)})`}`);
}

function sectionContent(startRe, endRes) {
  const start = findLineIndex(startRe);
  if (start === -1) return null;
  let end = lines.length;
  for (const er of endRes) {
    const idx = lines.findIndex((l, i) => i > start && er.test(l));
    if (idx !== -1 && idx < end) end = idx;
  }
  return lines.slice(start, end).join('\n');
}

function hasTableWithData(block) {
  if (!block) return false;
  const rows = block.split(/\r?\n/).filter(l => /^\s*\|/.test(l));
  if (rows.length < 2) return false;
  let sepSeen = false;
  for (const r of rows) {
    if (/^\s*\|(\s*:?-+:?\s*\|)+\s*$/.test(r)) { sepSeen = true; continue; }
    if (!sepSeen) continue;
    const cells = r.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length === 0) continue;
    const meaningful = cells.some(c => c && !/^<[^>]+>$/.test(c) && !/^(\s*|-+|\.{2,})$/.test(c));
    if (meaningful) return true;
  }
  return false;
}

function blockHasLabel(block, label) {
  if (!block) return false;
  const re = new RegExp(`^\\s*-\\s*\\*\\*${escapeRe(label)}\\*\\*\\s*:?\\s*(.+)$`, 'm');
  const m = block.match(re);
  if (!m) return false;
  const v = m[1].trim();
  return v && !/^<[^>]+>$/.test(v);
}

if (type === 'spec') {
  if (!/^#\s+Technical Specification:\s*\S+/.test(lines[0] || '') || /<Feature\/Topic>/.test(lines[0] || '')) {
    errors.push('missing or placeholder H1: expected "# Technical Specification: <name>"');
  }
  requireLabel('Status');
  requireLabel('Date');
  requireLabel('Functional spec');
  requireLabel('Related docs', { allowNA: true });

  const sections = [
    [/^##\s+1\.\s+Context & Scope\b/, '## 1. Context & Scope'],
    [/^##\s+2\.\s+Decisions\b/, '## 2. Decisions (ADR-style)'],
    [/^##\s+3\.\s+Technical Design & Contracts\b/, '## 3. Technical Design & Contracts'],
    [/^##\s+4\.\s+Risks & Mitigations\b/, '## 4. Risks & Mitigations'],
    [/^##\s+5\.\s+Risk → Test Mapping\b/, '## 5. Risk → Test Mapping'],
    [/^##\s+6\.\s+Feature-Specific Invariants\b/, '## 6. Feature-Specific Invariants (if any)'],
    [/^##\s+7\.\s+Validation Spikes\b/, '## 7. Validation Spikes'],
    [/^##\s+8\.\s+Reviewer Guidelines\b/, '## 8. Reviewer Guidelines (for `/review`)'],
    [/^##\s+9\.\s+Handoff to Planning\b/, '## 9. Handoff to Planning'],
  ];
  for (const [re, name] of sections) if (!hasHeading(re)) errors.push(`missing section: ${name}`);

  const sec1 = sectionContent(sections[0][0], [sections[1][0]]);
  for (const label of ['Goal / user-visible behavior', 'In scope', 'Out of scope / non-goals', 'Constraints', 'Assumptions', 'Unknowns / open questions']) {
    if (!blockHasLabel(sec1, label)) errors.push(`section 1 missing or empty field: "${label}"`);
  }

  const sec2 = sectionContent(sections[1][0], [sections[2][0]]);
  const decisionHeads = (sec2 || '').match(/^###\s+D\d+\./gm) || [];
  if (decisionHeads.length === 0) errors.push('section 2 must contain at least one decision heading "### D1. ..."');
  for (const label of ['Status', 'Context / problem', 'Options considered', 'Decision', 'Rationale', 'Consequences / tradeoffs']) {
    if (!blockHasLabel(sec2, label)) errors.push(`section 2 missing or empty field: "${label}" (required per decision)`);
  }

  const sec3 = sectionContent(sections[2][0], [sections[3][0]]);
  for (const label of [
    'State ownership & reactivity/binding model',
    'Single writer per concern',
    'Separation of concerns & responsibilities',
    'Module boundaries, data flow & dependency direction',
    'Interfaces / contracts affected',
    'Boundary contracts & validation',
  ]) {
    if (!blockHasLabel(sec3, label)) errors.push(`section 3 missing or empty field: "${label}"`);
  }

  const sec4 = sectionContent(sections[3][0], [sections[4][0]]);
  if (!hasTableWithData(sec4)) errors.push('section 4 must contain a table with at least one populated data row');
  const sec5 = sectionContent(sections[4][0], [sections[5][0]]);
  if (!hasTableWithData(sec5)) errors.push('section 5 must contain a table with at least one populated data row');
  const sec6 = sectionContent(sections[5][0], [sections[6][0]]);
  if (!hasTableWithData(sec6)) errors.push('section 6 must contain a table with at least one populated data row');
  const sec7 = sectionContent(sections[6][0], [sections[7][0]]);
  if (!hasTableWithData(sec7)) errors.push('section 7 must contain a table with at least one populated data row');

  const sec8 = sectionContent(sections[7][0], [sections[8][0]]);
  for (const label of ['Contracts to uphold', 'Boundary validation to uphold', 'Cross-cutting invariants to uphold', 'Feature-specific invariants to uphold', 'Design/quality to uphold', 'Test adequacy expectations', 'High-risk areas / focus', 'References']) {
    if (!blockHasLabel(sec8, label)) errors.push(`section 8 missing or empty field: "${label}"`);
  }

  const sec9 = sectionContent(sections[8][0], []);
  if (!sec9 || !/\S/.test(sec9.replace(/^##.*$/m, '').replace(/<!--.*?-->/gs, ''))) errors.push('section 9 must have content');
  if (!blockHasLabel(sec9, 'Suggested slice boundaries/risks for planning (non-sequencing)')) errors.push('section 9 missing or empty field: "Suggested slice boundaries/risks for planning (non-sequencing)"');

} else if (type === 'plan') {
  if (!/^#\s+Plan:\s*\S+/.test(lines[0] || '') || /<Feature\/Topic>/.test(lines[0] || '')) {
    errors.push('missing or placeholder H1: expected "# Plan: <name>"');
  }
  requireLabel('Status');
  requireLabel('Date');
  requireLabel('Functional spec');
  requireLabel('Technical spec');
  requireLabel('Related docs', { allowNA: true });

  const sections = [
    [/^##\s+Goal & Scope\b/, '## Goal & Scope'],
    [/^##\s+Chunks\b/, '## Chunks (vertical slices)'],
    [/^##\s+Validation spikes \/ prerequisites\b/, '## Validation spikes / prerequisites'],
    [/^##\s+Modification rules\b/, '## Modification rules'],
    [/^##\s+Change log\b/, '## Change log'],
  ];
  for (const [re, name] of sections) if (!hasHeading(re)) errors.push(`missing section: ${name}`);

  const sec1 = sectionContent(sections[0][0], [sections[1][0]]);
  for (const label of ['Goal', 'In scope (chunks cover)', 'Out of scope']) {
    if (!blockHasLabel(sec1, label)) errors.push(`Goal & Scope missing or empty field: "${label}"`);
  }

  const sec2 = sectionContent(sections[1][0], [sections[2][0]]);
  const chunkHeads = (sec2 || '').match(/^###\s+Chunk\s+\d+/gm) || [];
  if (chunkHeads.length === 0) errors.push('Chunks section must contain at least one "### Chunk N — ..." heading');
  if (sec2) {
    for (const label of ['Status', 'Functional perimeter', 'Acceptance criteria (traceable to functional spec)', 'Dependencies', 'Notable risks / contracts', 'Verification']) {
      if (!blockHasLabel(sec2, label)) errors.push(`chunk missing or empty field: "${label}"`);
    }
    if (!/\n\s*- \[[ xX]\]\s+\S+/.test(sec2)) errors.push('at least one chunk must include a populated acceptance criterion checkbox (- [ ] ...)');
  }

  const sec3 = sectionContent(sections[2][0], [sections[3][0]]);
  if (!hasTableWithData(sec3)) errors.push('Validation spikes / prerequisites must contain a table with at least one populated data row');

  const sec4 = sectionContent(sections[3][0], [sections[4][0]]);
  if (!sec4 || !/\*\*Autonomous\b/.test(sec4) || !/\*\*Consult user first\b/.test(sec4)) {
    errors.push('Modification rules must state both "Autonomous..." and "Consult user first..." rules');
  }

  const sec5 = sectionContent(sections[4][0], []);
  if (!hasTableWithData(sec5)) errors.push('Change log must contain a table with at least one populated data row');
}

if (errors.length) {
  console.error(`Structural check failed for ${type} (${file}):`);
  fail(errors);
}
console.log(`OK: ${type} structure valid (${file})`);
