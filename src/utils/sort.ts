export type SortField = 'default' | 'name' | 'level' | 'zeon';
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: SortField;
  direction: SortDirection;
}

const MAIN_PATH_ORDER = [
  'Light',
  'Darkness',
  'Creation',
  'Destruction',
  'Air',
  'Water',
  'Fire',
  'Earth',
  'Essence',
  'Illusion',
  'Necromancy',
] as const;

const SECONDARY_PATH_ORDER = [
  'Chaos',
  'War',
  'Literature',
  'Death',
  'Music',
  'Nobility',
  'Peace',
  'Sin',
  'Knowledge',
  'Blood',
  'Dreams',
  'Time',
  'Umbra',
  'Void',
] as const;

const MAIN_PATH_RANK = new Map<string, number>(MAIN_PATH_ORDER.map((p, i) => [p, i]));
const SECONDARY_PATH_RANK = new Map<string, number>(
  SECONDARY_PATH_ORDER.map((p, i) => [p, i]),
);

const CATEGORY_RANK: Record<string, number> = {
  main: 0,
  secondary: 1,
  free_access: 2,
};

interface SpellLike {
  name?: string;
  category?: 'main' | 'secondary' | 'free_access';
  path?: string | null;
  level?: number | null;
  level_bracket?: [number, number] | null;
  grades?: {
    arcane?: {
      zeon?: number;
    };
  };
}

function spellLevelValue(spell: SpellLike): number {
  if (spell.category === 'free_access') return spell.level_bracket?.[0] ?? 0;
  return spell.level ?? 0;
}

function pathRank(spell: SpellLike): number {
  if (spell.category === 'main') return MAIN_PATH_RANK.get(spell.path ?? '') ?? 999;
  if (spell.category === 'secondary')
    return SECONDARY_PATH_RANK.get(spell.path ?? '') ?? 999;
  return 0;
}

export function compareSpellsDefault(a: SpellLike, b: SpellLike): number {
  const cat = (CATEGORY_RANK[a.category ?? ''] ?? 9) - (CATEGORY_RANK[b.category ?? ''] ?? 9);
  if (cat !== 0) return cat;

  if (a.category === 'free_access' || b.category === 'free_access') {
    const level = spellLevelValue(a) - spellLevelValue(b);
    if (level !== 0) return level;
    return (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base' });
  }

  const path = pathRank(a) - pathRank(b);
  if (path !== 0) return path;

  const level = spellLevelValue(a) - spellLevelValue(b);
  if (level !== 0) return level;

  return (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base' });
}

export function createSortComparator(field: SortField, direction: SortDirection) {
  return (a: SpellLike, b: SpellLike) => {
    if (field === 'default') return compareSpellsDefault(a, b);

    let aVal: string | number;
    let bVal: string | number;

    switch (field) {
      case 'name':
        aVal = a.name?.toLowerCase() ?? '';
        bVal = b.name?.toLowerCase() ?? '';
        break;
      case 'level':
        aVal = spellLevelValue(a);
        bVal = spellLevelValue(b);
        break;
      case 'zeon':
        aVal = a.grades?.arcane?.zeon ?? 0;
        bVal = b.grades?.arcane?.zeon ?? 0;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  };
}

export function toggleSortDirection(current: SortState, field: SortField): SortState {
  if (current.field === field) {
    return { field, direction: current.direction === 'asc' ? 'desc' : 'asc' };
  }
  return { field, direction: 'asc' };
}
