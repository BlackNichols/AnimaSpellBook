# Spellbook Persistence & JSON Format

Technical decisions for spellbook data model, `localStorage` persistence, and single-spellbook JSON export/import. Functional behavior: `documentation/specifications/features/SPELLBOOK.md`.

## 1. Storage (local, client-only)

- **Key:** `localStorage['anima-spellbook-state']` stores the full root state as JSON.
- **Behavior:** Auto-save on every mutation; restore on init. Invalid/corrupt stored data must not crash the app and must not apply partial corrupt state (fall back to a safe empty root). Storage quota/unavailability errors are handled gracefully (non-fatal warning; in-memory state remains usable for the session).

## 2. Root schema (versioned)

```ts
interface SpellbookRootState {
  version: 1;
  activeSpellbookId: string | null;
  defaultNameCounter: number;
  spellbooks: Spellbook[];
}

interface Spellbook {
  id: string;        // UUID
  name: string;      // user-editable, not required unique
  sections: Section[];
}

interface Section {
  id: string;        // UUID
  name: string | null; // null = unnamed default section (no header)
  spellIds: string[];  // ordered spell IDs (references dataset spell.id)
}
```

- **IDs:** `crypto.randomUUID()` for spellbook and section IDs. `spellIds` reference spell `id` values from the bundled dataset.
- **Default naming:** New spellbooks (create, duplicate result, create-on-import/add when name absent) use `Spellbook ${defaultNameCounter}`; `defaultNameCounter` increments and is persisted. Names are best-effort only.

## 3. Section invariants (M1, explicit default section)

- `sections: []` represents an empty spellbook (no sections, no spells).
- Spells with no named section live in exactly **one** section with `name: null` (unnamed/default; no visible header). 
- **At most one** `name: null` section per spellbook.
- **No duplicate spell IDs within a section.** `spellIds` are ordered. (Structure allows future support for duplicates/cross-section presence as a logic change.)
- **Create first named section:** convert/reposition the existing default (`name: null`) section in place into that named section (set `name`, keep its `id` and `spellIds`), applying user-chosen placement (first/last/specific position). All existing spells move into it.
- **Delete last named section:** consolidate its `spellIds` (in order) into a single `name: null` section (book returns to unnamed-default state).
- Empty named sections are valid and preserved.

## 4. JSON export/import (plain JSON, single spellbook)

Export/import represents a **single spellbook** (not the full root). JSON and PDF exports are separate.

### 4.1 Export envelope

```ts
interface SpellbookExportEnvelope {
  schema: "anima-spellbook";
  version: 1;
  exportedAt?: string; // ISO timestamp, optional
  spellbook: {
    id: string;
    name: string;
    sections: { id: string; name: string | null; spellIds: string[] }[];
  };
}
```

- **Format:** Plain JSON (UTF-8). 
- **UX:** Download as `.json` file (default filename derived from spellbook name, e.g. `<name-or-Spellbook>.json`) and/or copy to clipboard.

### 4.2 Import behavior

- **Input:** Paste JSON or select a `.json` file, processed by the same validation/import flow.
- **Mode (user choice):**
  - **Overwrite active:** replace the active spellbook’s content (`name`, `sections` structure/order/`spellIds`) with the sanitized payload. Keep the active spellbook’s UUID and active status/route.
  - **Create new:** create a new spellbook with a **new UUID** (and fresh section IDs), use payload `name` if non-empty else assign a default incremented name, insert it, and make it active (navigate to it). Payload `spellbook.id` is not reused.
- **Validation:** Require supported `schema` and `version` and valid shape. Invalid/unsupported payloads produce an error and **apply no partial state**.
- **Sanitization:** Normalize ordering/structure and enforce invariants (including single `name: null` section and no duplicate IDs within a section). Spell IDs not present in the current bundled dataset are **skipped**; the valid remainder is imported and an **error summary listing skipped IDs** is shown to the user.
- **Versioning:** Root and envelope carry `version: 1` to allow future migrations.
