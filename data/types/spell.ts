/**
 * Type definitions for Anima Beyond Fantasy (Core Exxet revision) Spellbook.
 */

export type SpellCategory = 'main' | 'secondary' | 'free_access';

export type MainMajorPath = 'Light' | 'Darkness' | 'Creation' | 'Destruction' | 'Necromancy';
export type MainMinorPath = 'Fire' | 'Water' | 'Earth' | 'Air' | 'Essence' | 'Illusion';
export type MainPath = MainMajorPath | MainMinorPath;

export type SecondaryPath =
  | 'Chaos'
  | 'War'
  | 'Literature'
  | 'Death'
  | 'Music'
  | 'Nobility'
  | 'Sin'
  | 'Knowledge'
  | 'Blood'
  | 'Dreams'
  | 'Time'
  | 'Peace'
  | 'Umbra'
  | 'Void';

export type ActionType = 'Active' | 'Passive';

export type SpellType =
  | 'Effect'
  | 'Spiritual'
  | 'Automatic'
  | 'Defense'
  | 'Detection'
  | 'Attack';

export type ResistanceType = 'MR' | 'PhR' | 'PsR' | 'VR' | 'DR';

export interface SpellGrade {
  zeon: number;
  min_int: number;
  maintenance: number | null; // null when the spell cannot be maintained
  resistance?: number | null; // Check difficulty required to resist this grade (or null)
  resistance_types?: ResistanceType[]; // Types of resistance (e.g. ['MR'], ['PhR'], ['MR', 'PsR'])
  description: string;
}

export interface SpellGrades {
  initial: SpellGrade;
  intermediate: SpellGrade;
  advanced: SpellGrade;
  arcane: SpellGrade;
}

export interface SpellMetadata {
  is_aoe: boolean;
  resistance_cap: number | null; // Highest resistance difficulty across grades, or null if no check
  resistance_types?: ResistanceType[]; // Types of resistance (e.g. ['MR'], ['PhR'], ['MR', 'PsR'])
  tags?: string[];
}

export interface BaseSpell {
  id: string; // Kebab-case unique identifier (e.g. "fire-ball")
  name: string;
  effect: string; // General concept / summary
  action: ActionType;
  types: SpellType[];
  daily_maintenance: boolean;
  grades: SpellGrades;
  metadata: SpellMetadata;
}

export interface MainPathSpell extends BaseSpell {
  category: 'main';
  path: MainPath;
  path_type: 'major' | 'minor';
  level: number; // Even numbers 2-100 (excluding 4,14..; and excluding 8,18.. for minor)
}

export interface SecondaryPathSpell extends BaseSpell {
  category: 'secondary';
  path: SecondaryPath;
  path_type: null;
  level: number; // 4, 14, 24, ..., 94
}

export interface FreeAccessSpell extends BaseSpell {
  category: 'free_access';
  path: null;
  path_type: null;
  level_bracket: [number, number]; // [1, 10], [10, 20], ..., [90, 100]
}

export type Spell = MainPathSpell | SecondaryPathSpell | FreeAccessSpell;

/**
 * Validates whether a spell's level conforms to Anima Beyond Fantasy path progression rules.
 */
export function validateSpellLevel(spell: Spell): { valid: boolean; error?: string } {
  if (spell.category === 'secondary') {
    if (spell.level < 4 || spell.level > 94 || spell.level % 10 !== 4) {
      return {
        valid: false,
        error: `Secondary path spell level must be 4, 14, 24, ..., 94 (got ${spell.level})`,
      };
    }
    return { valid: true };
  }

  if (spell.category === 'main') {
    if (spell.level < 2 || spell.level > 100 || spell.level % 2 !== 0) {
      return {
        valid: false,
        error: `Main path spell level must be an even integer between 2 and 100 (got ${spell.level})`,
      };
    }
    if (spell.level % 10 === 4) {
      return {
        valid: false,
        error: `Main paths cannot have spells at level ending in 4 (${spell.level}), which are reserved for secondary paths`,
      };
    }
    if (spell.path_type === 'minor' && spell.level % 10 === 8) {
      return {
        valid: false,
        error: `Minor paths cannot have spells at level ending in 8 (${spell.level}), which are exclusive to major paths`,
      };
    }
    return { valid: true };
  }

  if (spell.category === 'free_access') {
    const validBrackets: [number, number][] = [
      [1, 10],
      [10, 20],
      [20, 30],
      [30, 40],
      [40, 50],
      [50, 60],
      [60, 70],
      [70, 80],
      [80, 90],
      [90, 100],
    ];
    const match = validBrackets.some(
      ([min, max]) =>
        min === spell.level_bracket[0] && max === spell.level_bracket[1]
    );
    if (!match) {
      return {
        valid: false,
        error: `Invalid Free Access level bracket: [${spell.level_bracket.join(', ')}]`,
      };
    }
    return { valid: true };
  }

  return { valid: false, error: 'Unknown spell category' };
}
