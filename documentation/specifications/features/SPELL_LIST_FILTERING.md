# Spell List with Filtering — Feature Specification

## 1. Overview

A client-only web page displaying a searchable, filterable list of spells from the embedded JSON dataset
(per `documentation/specifications/data/JSON_DATA_FORMAT.md`). No backend is required.

## 2. List View

### 2.1 Columns

- **Default visible columns:** `name`, `description`
- **User-customizable columns:** the user can add or remove columns from all available spell fields
  (path, level, action, types, daily_maintenance, zeon cost, min_int, etc.)

### 2.2 Sorting

Results can be sorted by:
- default order,
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

| Filter | Type | Options / semantics |
|--------|------|---------------------|
| **Path** | Multi-select | All defined paths plus `null` (Free Access spells) |
| **Maintenance** | Tri-state | `no` (no maintenance at any grade), `yes` (maintenance on any grade), `daily only` (`daily_maintenance == true`) |
| **Area of Effect** | Boolean | `metadata.is_aoe` — yes / no |
| **Level** | Min / Max / Range | Main & Secondary spells: `level` integer.<br>Free Access spells: `level_bracket` `[low, high]` — a bracket overlaps the range if `low <= max AND high >= min`; Free Access spells are excluded when the filter value is not a multiple of 10 |
| **Zeon cost** | Min / Max / Range | Per-grade `zeon`. Match mode: **any grade** (default) or **highest cost** (arcane grade) |
| **Min Intelligence** | Min / Max / Range | Per-grade `min_int`. Match mode: **any grade** (default) or **highest** (arcane grade) |
| **Action** | Single-select | `Active` / `Passive` / `All` |
| **Types** | Multi-select | `Effect`, `Spiritual`, `Automatic`, `Defense`, `Detection`, `Attack` |

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
