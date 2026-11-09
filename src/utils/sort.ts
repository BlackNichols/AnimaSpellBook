// Sort utilities - pure functions for testing
export type SortField = 'default' | 'name' | 'level' | 'zeon';
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: SortField;
  direction: SortDirection;
}

interface SpellLike {
  name?: string;
  category?: 'main' | 'secondary' | 'free_access';
  level?: number | null;
  level_bracket?: [number, number] | null;
  grades?: {
    arcane?: {
      zeon?: number;
    };
  };
}

export function createSortComparator(field: SortField, direction: SortDirection) {
  return (a: SpellLike, b: SpellLike) => {
    if (field === 'default') return 0;

    let aVal: string | number;
    let bVal: string | number;

    switch (field) {
      case 'name':
        aVal = a.name?.toLowerCase() ?? '';
        bVal = b.name?.toLowerCase() ?? '';
        break;
      case 'level':
        aVal = a.category === 'free_access' ? a.level_bracket?.[0] ?? 0 : a.level ?? 0;
        bVal = b.category === 'free_access' ? b.level_bracket?.[0] ?? 0 : b.level ?? 0;
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
