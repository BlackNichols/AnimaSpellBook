# Spell List with Filtering — Feature Specification

## 1. Overview

A client-only web page displaying a searchable, filterable list of spells from the embedded JSON dataset
(per `documentation/specifications/data/JSON_DATA_FORMAT.md`). No backend is required.

## 2. List View

### 2.1 Columns

- **Default visible columns:** `name`, `path`, `level`, `effect` (labeled "Description" in the UI). (Implemented; `effect` is used as the description column for now.)

  - `path`: spell path name; Free Access spells display `Free Access` (their `path` is `null`).
  - `level`: `level` for Main/Secondary spells; Free Access spells display their `level_bracket` as `low-high` (e.g. `1-10`).
- **User-customizable columns:** the user can add or remove columns from all available spell fields
  (path, level, action, types, daily_maintenance, zeon cost, min_int, etc.)

### 2.2 Sorting

Results can be sorted by:
- default order (Main paths in order: Light, Darkness, Creation, Destruction, Air, Water, Fire, Earth, Essence, Illusion, Necromancy; then Secondary paths in order: Chaos, War, Literature, Death, Music, Nobility, Peace, Sin, Knowledge, Blood, Dreams, Time, Umbra, Void; then Free Access. Within a path spells are ordered by `level`. Free Access spells are ordered by `level_bracket` start (`1-10`, `10-20`, …), then alphabetically by `name`.),
- name (asc/desc),
- level (asc/desc),
- zeon cost (asc/desc).

### 2.3 Full-text search

A free-text search box matches against:
- `name`
- `effect`
- all four grade `description`s (`initial`, `intermediate`, `advanced`, `arcane`)

Search results are ranked by full-text search scoring when a query is present.

## 3. Filters

All filters combine with **AND** by default. **OR** between filters is a future incremental enhancement.
Filter sections start minimized unless the filter is selected (including via URL query parameters).

| Filter | Type | Options / semantics |
|--------|------|---------------------|
| **Category + Path** | Checkbox groups | Main/Secondary paths by name; `free_access` (Free Access). `paths` URL param stores selected keys; AND with other filters. (Implemented) |
| **Maintenance** | Tri-state | `no` (no maintenance at any grade), `yes` (maintenance on any grade), `daily only` (`daily_maintenance == true`) |
| **Area of Effect** | Boolean | `metadata.is_aoe` — All / AoE only / Non-AoE only. (Implemented) |
| **Level** | Min / Max / Range | Main & Secondary: `level`. Free Access: bracket `[low,high]` included only when it overlaps the range and `low < max` / `high > min` (e.g. max 50 excludes 50-60); excluded when a filter bound is not a multiple of 10. (Implemented UI + logic) |
| **Zeon cost** | Min / Max / Range | Per-grade `zeon`. Match mode: **any grade** (default) or **highest cost** (arcane). (Implemented) |
| **Min Intelligence** | Min / Max / Range | Per-grade `min_int`. Match mode: **any grade** (default) or **highest** (arcane). (Implemented) |
| **Action** | Single-select | `Active` / `Passive` / `All`. (Implemented) |
| **Types** | Multi-select | `Effect`, `Spiritual`, `Automatic`, `Defense`, `Detection`, `Attack` (match any selected). (Implemented) |

## 4. Filter Combination

- All active filters combine with **AND**.
- **OR** between filters is planned as an incremental future enhancement.

## 5. URL & Persistence

- All active filters, the free-text search query, the active sort, and the visible column set are reflected
  in the page **URL query parameters** so the view is shareable and bookmarkable.
- Loading a URL that contains filter parameters applies those filters automatically on page load.

## 6. Data Reference

Spell shape (from `documentation/specifications/data/JSON_DATA_FORMAT.md`):

- `id` (string)
- `name` (string)
- `category` (`main` \| `secondary` \| `free_access`)
- `path` (string \| null)
- `path_type` (`major` \| `minor` \| null)
- `level` (number \| null)
- `level_bracket` ([number, number] \| null)
- `action` (`Active` \| `Passive`)
- `types` (string[])
- `daily_maintenance` (boolean)
- `effect` (string)
- `grades.{initial,intermediate,advanced,arcane}.{zeon,min_int,maintenance,resistance,resistance_types,description}`
- `metadata.{is_aoe,resistance_cap,resistance_types,tags[]}`
