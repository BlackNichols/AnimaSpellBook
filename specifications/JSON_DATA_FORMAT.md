# JSON Spell Storage Specification (Anima: Beyond Fantasy)

## 1. Overview

This specification defines the JSON data storage format for spells in the *Anima: Beyond Fantasy* (Core Exxet revision) spellbook system. The dataset is designed to be hard-coded / embedded in a client-only web application (no backend) and consumed by scripts to generate high-quality LaTeX documents.

---

## 2. Spell Classification & Path Rules

Spells are partitioned into three distinct categories:

### 2.1 Main Paths
Main paths are subdivided into **Major** and **Minor** paths:
* **Major Paths (5)**: `Light`, `Darkness`, `Creation`, `Destruction`, `Necromancy`.
* **Minor Paths (6)**: `Fire`, `Water`, `Earth`, `Air`, `Essence`, `Illusion`.

**Level Rules:**
* Must be an **even number** between $2$ and $100$.
* Cannot end in $4$ (i.e. $level \not\equiv 4 \pmod{10}$): $4, 14, 24, \dots, 94$ are reserved for Secondary Paths.
* For **Minor Paths**, levels also cannot end in $8$ (i.e. $level \not\equiv 8 \pmod{10}$): $8, 18, 28, \dots, 98$ are exclusive to Major Paths.
* *Valid Major Path Levels*: $\{2, 6, 8, 10, 12, 16, 18, 20, \dots, 98, 100\}$.
* *Valid Minor Path Levels*: $\{2, 6, 10, 12, 16, 20, \dots, 96, 100\}$ (numbers ending in $0, 2, 6$).

### 2.2 Secondary Paths
There are **14 Secondary Paths**:
`Chaos`, `War`, `Literature`, `Death`, `Music`, `Nobility`, `Sin`, `Knowledge`, `Blood`, `Dreams`, `Time`, `Peace`, `Umbra`, `Void`.

**Level Rules:**
* Must end in $4$ from $4$ to $94$: $\{4, 14, 24, 34, 44, 54, 64, 74, 84, 94\}$.

### 2.3 Free Access Spells
Free Access spells do not belong to any path (`path: null`).

**Level Rules:**
* Defined in dual-number ranges (brackets) representing the level tier:
  `[1, 10]`, `[10, 20]`, `[20, 30]`, `[30, 40]`, `[40, 50]`, `[50, 60]`, `[60, 70]`, `[70, 80]`, `[80, 90]`, `[90, 100]`.

---

## 3. Spell Characteristics & Fields

### 3.1 Top-Level Attributes

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique kebab-case slug identifier (e.g. `"bola-de-fuego"`, `"alter-destiny"`). |
| `name` | `string` | Display name of the spell. |
| `category` | `enum` | `"main"`, `"secondary"`, or `"free_access"`. |
| `path` | `enum \| null` | Name of path (or `null` if `category == "free_access"`). |
| `path_type` | `enum \| null` | `"major"`, `"minor"`, or `null` (only used for `category == "main"`). |
| `level` | `number \| null` | Integer level for Main and Secondary spells (`null` for Free Access). |
| `level_bracket` | `[number, number] \| null` | Dual level bounds for Free Access spells (`null` for Main / Secondary). |
| `action` | `enum` | `"Active"` or `"Passive"`. |
| `type` | `enum` | `"Effect"`, `"Spiritual"`, `"Automatic"`, `"Defense"`, `"Detection"`, or `"Attack"`. |
| `daily_maintenance` | `boolean` | `true` if maintenance is paid daily; `false` if paid per combat turn. |
| `effect` | `string` | General concept and narrative summary of the spell. |
| `grades` | `object` | Co-located casting level characteristics across all 4 grades. |
| `metadata` | `object` | Structured attributes for querying and filtering. |

> **Note on Duration & Range:** In Anima Beyond Fantasy (Core Exxet), Range is determined by the caster's Magic Projection table, and Duration is as long as maintenance is paid (or instant if unmaintainable). They are therefore not components of the spell object itself.

---

### 3.2 The 4 Casting Grades (`grades`)

Every spell strictly defines all **four casting grades**:
1. `initial` (Base)
2. `intermediate` (Intermedio)
3. `advanced` (Avanzado)
4. `arcane` (Arcano)

Each grade contains:

| Property | Type | Description |
|---|---|---|
| `zeon` | `number` | Zeon points required to cast at this grade. |
| `min_int` | `number` | Minimum Intelligence required to access this grade. |
| `maintenance` | `number \| null` | Zeon cost to maintain. **Must be `null`** if the spell cannot be maintained. |
| `description` | `string` | Specific mechanical rules and effect when cast at this grade. |

---

### 3.3 Metadata (`metadata`)

Formalized fields used by the website for fast searching and filtering:

| Property | Type | Description |
|---|---|---|
| `is_aoe` | `boolean` | `true` if the spell affects an Area of Effect (AoE). |
| `magic_resistance_cap` | `number \| null` | Magic Resistance (MR) target to overcome (e.g. `140`), or `null` if no MR check applies. |
| `tags` | `string[]` | Optional query tags (e.g. `["Damage", "Heat", "Projectile"]`). |

---

## 4. TypeScript Interface

```typescript
export type SpellCategory = 'main' | 'secondary' | 'free_access';

export type MainMajorPath = 'Light' | 'Darkness' | 'Creation' | 'Destruction' | 'Necromancy';
export type MainMinorPath = 'Fire' | 'Water' | 'Earth' | 'Air' | 'Essence' | 'Illusion';
export type MainPath = MainMajorPath | MainMinorPath;

export type SecondaryPath =
  | 'Chaos' | 'War' | 'Literature' | 'Death' | 'Music' | 'Nobility' | 'Sin'
  | 'Knowledge' | 'Blood' | 'Dreams' | 'Time' | 'Peace' | 'Umbra' | 'Void';

export type ActionType = 'Active' | 'Passive';

export type SpellType =
  | 'Effect'
  | 'Spiritual'
  | 'Automatic'
  | 'Defense'
  | 'Detection'
  | 'Attack';

export interface SpellGrade {
  zeon: number;
  min_int: number;
  maintenance: number | null; // null if unmaintainable
  description: string;
}

export interface SpellGrades {
  initial: SpellGrade;
  intermediate: SpellGrade;
  advanced: SpellGrade;
  arcane: SpellGrade; // All 4 grades strictly required
}

export interface SpellMetadata {
  is_aoe: boolean;
  magic_resistance_cap: number | null;
  tags?: string[];
}

export interface BaseSpell {
  id: string;
  name: string;
  effect: string;
  action: ActionType;
  type: SpellType;
  daily_maintenance: boolean;
  grades: SpellGrades;
  metadata: SpellMetadata;
}

export interface MainPathSpell extends BaseSpell {
  category: 'main';
  path: MainPath;
  path_type: 'major' | 'minor';
  level: number;
  level_bracket: null;
}

export interface SecondaryPathSpell extends BaseSpell {
  category: 'secondary';
  path: SecondaryPath;
  path_type: null;
  level: number;
  level_bracket: null;
}

export interface FreeAccessSpell extends BaseSpell {
  category: 'free_access';
  path: null;
  path_type: null;
  level: null;
  level_bracket: [number, number];
}

export type Spell = MainPathSpell | SecondaryPathSpell | FreeAccessSpell;
```

---

## 5. Formal JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "AnimaSpellBookEntry",
  "type": "object",
  "required": [
    "id",
    "name",
    "category",
    "action",
    "type",
    "daily_maintenance",
    "effect",
    "grades",
    "metadata"
  ],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[a-z0-9]+(-[a-z0-9]+)*$"
    },
    "name": {
      "type": "string"
    },
    "category": {
      "type": "string",
      "enum": ["main", "secondary", "free_access"]
    },
    "path": {
      "type": ["string", "null"],
      "enum": [
        "Light", "Darkness", "Creation", "Destruction", "Necromancy",
        "Fire", "Water", "Earth", "Air", "Essence", "Illusion",
        "Chaos", "War", "Literature", "Death", "Music", "Nobility", "Sin",
        "Knowledge", "Blood", "Dreams", "Time", "Peace", "Umbra", "Void",
        null
      ]
    },
    "path_type": {
      "type": ["string", "null"],
      "enum": ["major", "minor", null]
    },
    "level": {
      "type": ["integer", "null"],
      "minimum": 2,
      "maximum": 100
    },
    "level_bracket": {
      "type": ["array", "null"],
      "items": { "type": "integer" },
      "minItems": 2,
      "maxItems": 2
    },
    "action": {
      "type": "string",
      "enum": ["Active", "Passive"]
    },
    "type": {
      "type": "string",
      "enum": ["Effect", "Spiritual", "Automatic", "Defense", "Detection", "Attack"]
    },
    "daily_maintenance": {
      "type": "boolean"
    },
    "effect": {
      "type": "string"
    },
    "metadata": {
      "type": "object",
      "required": ["is_aoe", "magic_resistance_cap"],
      "properties": {
        "is_aoe": { "type": "boolean" },
        "magic_resistance_cap": { "type": ["integer", "null"] },
        "tags": {
          "type": "array",
          "items": { "type": "string" }
        }
      },
      "additionalProperties": false
    },
    "grades": {
      "type": "object",
      "required": ["initial", "intermediate", "advanced", "arcane"],
      "properties": {
        "initial": { "$ref": "#/$defs/grade" },
        "intermediate": { "$ref": "#/$defs/grade" },
        "advanced": { "$ref": "#/$defs/grade" },
        "arcane": { "$ref": "#/$defs/grade" }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "$defs": {
    "grade": {
      "type": "object",
      "required": ["zeon", "min_int", "maintenance", "description"],
      "properties": {
        "zeon": { "type": "integer", "minimum": 0 },
        "min_int": { "type": "integer", "minimum": 1, "maximum": 20 },
        "maintenance": { "type": ["integer", "null"], "minimum": 0 },
        "description": { "type": "string" }
      },
      "additionalProperties": false
    }
  }
}
```

---

## 6. Examples

### 6.1 Main Minor Path (Fire, Level 12)
```json
{
  "id": "fire-ball",
  "name": "Bola de Fuego",
  "category": "main",
  "path": "Fire",
  "path_type": "minor",
  "level": 12,
  "level_bracket": null,
  "action": "Active",
  "type": "Attack",
  "daily_maintenance": false,
  "effect": "Creates a sphere of flames that flies towards the target and detonates upon impact.",
  "metadata": {
    "is_aoe": true,
    "magic_resistance_cap": null,
    "tags": ["Damage", "Fire", "Projectile"]
  },
  "grades": {
    "initial": {
      "zeon": 40,
      "min_int": 6,
      "maintenance": null,
      "description": "Inflicts a base damage of 40 Heat in a 5-meter radius."
    },
    "intermediate": {
      "zeon": 70,
      "min_int": 7,
      "maintenance": null,
      "description": "Inflicts a base damage of 60 Heat in a 10-meter radius."
    },
    "advanced": {
      "zeon": 110,
      "min_int": 9,
      "maintenance": null,
      "description": "Inflicts a base damage of 80 Heat in a 25-meter radius."
    },
    "arcane": {
      "zeon": 150,
      "min_int": 11,
      "maintenance": null,
      "description": "Inflicts a base damage of 100 Heat in a 50-meter radius."
    }
  }
}
```

### 6.2 Secondary Path (Chaos, Level 24)
```json
{
  "id": "alter-destiny",
  "name": "Alter Destiny",
  "category": "secondary",
  "path": "Chaos",
  "path_type": null,
  "level": 24,
  "level_bracket": null,
  "action": "Active",
  "type": "Spiritual",
  "daily_maintenance": false,
  "effect": "Disrupts the thread of probability surrounding an opponent.",
  "metadata": {
    "is_aoe": false,
    "magic_resistance_cap": 140,
    "tags": ["Debuff", "Luck"]
  },
  "grades": {
    "initial": {
      "zeon": 50,
      "min_int": 6,
      "maintenance": 10,
      "description": "Target suffers a -20 penalty to all rolls for 1 turn."
    },
    "intermediate": {
      "zeon": 90,
      "min_int": 8,
      "maintenance": 20,
      "description": "Target suffers a -40 penalty to all rolls for 1 turn."
    },
    "advanced": {
      "zeon": 130,
      "min_int": 10,
      "maintenance": 30,
      "description": "Target suffers a -60 penalty to all rolls for 1 turn."
    },
    "arcane": {
      "zeon": 180,
      "min_int": 12,
      "maintenance": 40,
      "description": "Target suffers a -80 penalty to all rolls for 1 turn."
    }
  }
}
```

### 6.3 Free Access Spell (Tier 10-20)
```json
{
  "id": "light-shield",
  "name": "Lesser Shield",
  "category": "free_access",
  "path": null,
  "path_type": null,
  "level": null,
  "level_bracket": [10, 20],
  "action": "Active",
  "type": "Defense",
  "daily_maintenance": false,
  "effect": "Forms a barrier of raw energy to absorb incoming impacts.",
  "metadata": {
    "is_aoe": false,
    "magic_resistance_cap": null,
    "tags": ["Shield", "Barrier"]
  },
  "grades": {
    "initial": {
      "zeon": 30,
      "min_int": 5,
      "maintenance": null,
      "description": "Absorbs up to 200 points of physical damage."
    },
    "intermediate": {
      "zeon": 60,
      "min_int": 7,
      "maintenance": null,
      "description": "Absorbs up to 400 points of physical damage."
    },
    "advanced": {
      "zeon": 90,
      "min_int": 9,
      "maintenance": null,
      "description": "Absorbs up to 700 points of physical damage."
    },
    "arcane": {
      "zeon": 130,
      "min_int": 10,
      "maintenance": null,
      "description": "Absorbs up to 1200 points of physical damage."
    }
  }
}
```
