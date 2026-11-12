# Spellbook — Feature Specification

## 1. Overview

Allow users to build and manage spellbooks containing spells their character can cast, arranged in a custom order. Spellbooks can be viewed in-app, persisted locally, exported/imported as JSON, and exported as PDF. The web spellbook view and the PDF export must be visually identical (including pagination).

**Scope (this iteration):** spell selection/addition, sections and ordering, spellbook management, local persistence, JSON export/import, PDF export, and the spellbook view.

**Out of scope (this iteration):** per-spell user notes/custom text edits, URL-encoded spellbooks, combined JSON+PDF export, print-only styling differences, file-upload import UX specifics (functional behavior is JSON payload import), navigating from a spellbook entry back to spell details, a “clear spellbook” action, and drag-and-drop ordering.

## 2. Data identity & integrity

- **Spells:** Identified by `id`. The current dataset has no duplicate IDs. A spell must not appear twice in the same section. A spell may appear in different sections only if future support for duplicates/cross-section presence is enabled (not required in this iteration).
- **Future-proofing:** Store spell references as an ordered list of spell IDs per section. An array represents order and can later accommodate duplicate IDs, so supporting the same spell in multiple places is primarily a logic change rather than a data-structure change.
- **Spellbooks:** Each spellbook has a unique internal UUID. Spellbook names are best-effort (not required to be unique) and user-editable.
- **Unknown references on import:** If an imported payload references a spell `id` not present in the current dataset, skip those entries and show the user an error summary listing skipped IDs; import the remaining valid content.

## 3. Views & navigation

- **Primary screens:** (1) **Spell list** (existing search/filter/browse view) and (2) **Spellbook** view. Users can move between them seamlessly.
- **No-spellbook state:** If no spellbooks exist (first visit or after deleting the last), show only the spell list. A spellbook is not required to exist until created.
- **Active spellbook:** Only one spellbook is editable/active at a time. Users can switch the active spellbook via a spellbook selector/list.

## 4. Adding spells to a spellbook

### 4.1 Actions (from spell list)

- **Add all filtered/displayed spells:** Adds all spells currently displayed by the active filters/search to the spellbook.
- **Add individual spell:** A control on each spell adds that spell.

### 4.2 Target selection and creation

- **Target section:** If the spellbook has named sections, the user chooses an existing section or creates a new one (providing a name). If the spellbook has no named section, spells are added to the default (unnamed) section (see §5).
- **Create spellbook on add:** If no spellbook exists, adding a spell or all filtered spells creates a new spellbook with a default name, makes it active, then adds the spells.

### 4.3 Deduplication, placement, and snapshot

- **Deduplication:** Skip spells already present in the target section; add the rest. A spell must not be duplicated within the same section.
- **Placement/order:** Added spells are appended to the end of the target section in the current displayed/filtered order.
- **Snapshot:** Adding “all filtered/displayed spells” snapshots the current results into the spellbook; later filter changes do not affect spells already added.

## 5. Sections

### 5.1 Default (unnamed) section

- A spellbook may have no named sections. In that case, spells belong to a default section that has **no visible header** in the web view or PDF.
- **First named section created:** Convert the default section into that named section (with the user-chosen name) and place all existing spells in it.
- **Last named section deleted:** Move all spells from that deleted section into the default (unnamed) section (no header shown).

### 5.2 Named sections

- Users can create, rename, delete, and reorder sections. Sections may be empty.
- **Empty sections:** An empty named section is shown in the web view and PDF (header with no spells) and included in JSON and PDF exports.
- **Membership:** When named sections exist, spells belong to sections. A spellbook may have zero sections and/or zero spells.

### 5.3 Section creation placement

When creating a new section (including when created during add or move), prompt the user to place it **first**, **last**, or at a **specific position number**.

### 5.4 Section ordering

Sections are ordered relative to each other. The user reorders sections by editing a position number.

### 5.5 Section deletion

- **Deleting the last named section:** Move its spells into the default (unnamed) section (see §5.1).
- **Deleting a non-last named section:** Prompt the user to either **delete the spells with the section** or **move them to a chosen existing section**.
- **Clear section:** Removes only the spells in that section; the (now empty) section remains.

## 6. Spell ordering & movement

- **Ordering scope:** Spells are ordered within a section. Sections are ordered relative to each other.
- **Reordering spells (within a section):** The user can reorder via **move up/down controls** and/or **edit a position number** (both provided).
- **Move spell to another section:** Supported without remove/re-add. A moved spell is placed at the **end** of the target section.
  - **Single move:** A per-spell “Move to…” action opens a target picker with existing sections and “New section…” (name prompt + placement per §5.3).
  - **Bulk move:** The user can multi-select spells in a section, then “Move selected to…” a target section (existing or new, with placement per §5.3 when new).
- **Cross-section drag-and-drop:** Not in scope for this iteration.

## 7. Spellbook management

- **Multiple spellbooks:** Persist and manage multiple spellbooks; only one is active/editable at a time.
- **Create:** Creates a new spellbook with a default name (e.g. “Spellbook 1”, incrementing the counter for new spellbooks; name uniqueness is not enforced). The user may rename it.
- **Duplicate spellbook:** Supported (alternative to a “clear spellbook” action). Duplicates content/structure into a new spellbook (new UUID, default/incremented name per creation rules). The duplicate can be made active and managed like any other spellbook.
- **Rename:** The user can rename any spellbook.
- **Delete:** The user can delete a spellbook. If the deleted book was active: switch to another spellbook at random if one exists; otherwise return to the no-spellbook state (spell list only).
- **Switch:** Via a spellbook selector/list.

## 8. Persistence, export & import

### 8.1 Local persistence (non-destructive)

- **Auto-save & restore:** All changes are auto-saved to `localStorage` and restored on revisit. `localStorage` state is JSON.
- **Sharing:** Users share spellbooks via the JSON payload. URLs must not reference `localStorage`, and full spellbooks are not stored in the URL in this iteration.

### 8.2 JSON export/import

- **Canonical editable save:** JSON export/import represents a single spellbook’s persisted state (export of that spellbook’s `localStorage` state). The payload may be versioned/migrated in a future iteration.
- **Import behavior:** On import, prompt the user to **overwrite the active spellbook** or **create a new spellbook** from the payload.
- **Validation/errors:** Invalid payloads display an error message and do not apply a partial/corrupt state. Spell `id` references not found in the current dataset are skipped with an error summary listing skipped IDs (see §2).
- **Separation:** JSON and PDF exports are separate actions/features.

### 8.3 PDF export

- **Trigger:** User-initiated download only (non-destructive export; not restorable as application state).
- **Filename:** A default filename is provided; the user can choose the location/name via the OS save dialog. No other export options in this iteration (no section selection, no paper-size choice).
- **Independence:** PDF export does not bundle or auto-download JSON.

## 9. Spellbook display & layout (web and PDF)

- **Content:** All spell information is always shown for every spell (no minimized/collapsed content in the spellbook).
- **Visual parity:** Web and PDF must be visually identical, including pagination and breaks.
- **Page format:** A4 portrait with standard margins for this document type.
- **Columns:** Two-column layout per page. Spell flow/order: **fill the left column top-to-bottom, then the right column top-to-bottom** (per page), with variable-height spells.
- **Splitting rules:** A spell may split across columns but should avoid splitting across pages. If a single spell cannot fit wholly on a page/available space, allow splitting across pages as a last resort.
- **Headers/footers/metadata:**
  - **Spellbook title:** Optional name shown at the very start of the spellbook (web and PDF). If empty/unnamed, display “Spellbook”.
  - **Section headers:** Show the name of each named section. The default/unnamed section has no header.
  - **Page numbers:** Shown at the bottom of each page.
  - **Excluded:** No generation date and no path labels as page/section metadata.

## 10. Key acceptance behaviors

- Adding spells when no spellbook exists creates a default-named active spellbook and adds the spells.
- Creating the first named section converts the default section into it, moving all spells inside.
- Deleting the last named section moves its spells into the unnamed default section (no header).
- Deleting a non-last named section requires choosing to delete contained spells or move them to another section.
- Moving a spell places it at the end of the target section; adding spells appends them in the displayed/filtered order.
- An empty named section renders (header only) in web/PDF and is preserved in JSON/PDF exports.
- Web view and exported PDF render the same content, order, styling, and pagination on A4.
- JSON import of an invalid payload shows an error and applies no partial state; unknown spell IDs are skipped with an error summary.
- Deleting the active spellbook switches to a random remaining spellbook, or returns to the no-spellbook (spell list only) state if none remain.
