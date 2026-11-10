import { describe, it, expect } from 'vitest';
import { matchesFilters } from '@/utils/filters';
import { scoreSpell, filterAndSortSpells } from '@/utils/search';
import { createSortComparator, toggleSortDirection } from '@/utils/sort';
import type { Spell } from '@/stores/spellStore';

const mockSpell: Spell = {
  id: 'test',
  name: 'Test Spell',
  category: 'main',
  path: 'Fire',
  path_type: 'major',
  level: 10,
  level_bracket: null,
  action: 'Active',
  types: ['Attack', 'Effect'],
  daily_maintenance: false,
  effect: 'A test spell effect',
  grades: {
    initial: {
      zeon: 10,
      min_int: 5,
      maintenance: null,
      resistance: 'Dodge',
      resistance_types: [],
      description: 'Initial desc',
    },
    intermediate: {
      zeon: 20,
      min_int: 7,
      maintenance: null,
      resistance: 'Dodge',
      resistance_types: [],
      description: 'Intermediate desc',
    },
    advanced: {
      zeon: 30,
      min_int: 9,
      maintenance: 2,
      resistance: 'Dodge',
      resistance_types: [],
      description: 'Advanced desc',
    },
    arcane: {
      zeon: 40,
      min_int: 11,
      maintenance: 4,
      resistance: 'Dodge',
      resistance_types: [],
      description: 'Arcane desc',
    },
  },
  metadata: { is_aoe: true, resistance_cap: null, resistance_types: [], tags: ['test'] },
};

describe('filters', () => {
  it('matches category/path filter for named path and free access', () => {
    const freeSpell = { ...mockSpell, id: 'f', name: 'F', category: 'free_access' as const, path: null, path_type: null, level: null, level_bracket: [1, 10] as [number, number] };
    const base = { paths: [] as string[], maintenance: 'all' as const, isAoe: null, levelMin: null, levelMax: null, zeonMin: null, zeonMax: null, zeonMode: 'any' as const, minIntMin: null, minIntMax: null, minIntMode: 'any' as const, action: 'all' as const, types: [] as string[] };
    expect(matchesFilters(mockSpell, { ...base, paths: ['Fire'] })).toBe(true);
    expect(matchesFilters(mockSpell, { ...base, paths: ['Water'] })).toBe(false);
    expect(matchesFilters(freeSpell, { ...base, paths: ['free_access'] })).toBe(true);
    expect(matchesFilters(freeSpell, { ...base, paths: ['Fire'] })).toBe(false);
    expect(matchesFilters(mockSpell, { ...base, paths: ['Fire', 'free_access'] })).toBe(true);
  });

  it('matches maintenance filter', () => {
    expect(
      matchesFilters(mockSpell, {
        paths: [],
        maintenance: 'yes',
        isAoe: null,
        levelMin: null,
        levelMax: null,
        zeonMin: null,
        zeonMax: null,
        zeonMode: 'any',
        minIntMin: null,
        minIntMax: null,
        minIntMode: 'any',
        action: 'all',
        types: [],
      })
    ).toBe(true);
    expect(
      matchesFilters(mockSpell, {
        paths: [],
        maintenance: 'no',
        isAoe: null,
        levelMin: null,
        levelMax: null,
        zeonMin: null,
        zeonMax: null,
        zeonMode: 'any',
        minIntMin: null,
        minIntMax: null,
        minIntMode: 'any',
        action: 'all',
        types: [],
      })
    ).toBe(false);
    expect(
      matchesFilters(mockSpell, {
        paths: [],
        maintenance: 'daily',
        isAoe: null,
        levelMin: null,
        levelMax: null,
        zeonMin: null,
        zeonMax: null,
        zeonMode: 'any',
        minIntMin: null,
        minIntMax: null,
        minIntMode: 'any',
        action: 'all',
        types: [],
      })
    ).toBe(false);
  });

  it('matches AoE filter', () => {
    expect(
      matchesFilters(mockSpell, {
        paths: [],
        maintenance: 'all',
        isAoe: true,
        levelMin: null,
        levelMax: null,
        zeonMin: null,
        zeonMax: null,
        zeonMode: 'any',
        minIntMin: null,
        minIntMax: null,
        minIntMode: 'any',
        action: 'all',
        types: [],
      })
    ).toBe(true);
    expect(
      matchesFilters(mockSpell, {
        paths: [],
        maintenance: 'all',
        isAoe: false,
        levelMin: null,
        levelMax: null,
        zeonMin: null,
        zeonMax: null,
        zeonMode: 'any',
        minIntMin: null,
        minIntMax: null,
        minIntMode: 'any',
        action: 'all',
        types: [],
      })
    ).toBe(false);
  });

  it('matches level filter for main spells', () => {
    expect(
      matchesFilters(mockSpell, {
        paths: [],
        maintenance: 'all',
        isAoe: null,
        levelMin: 5,
        levelMax: 15,
        zeonMin: null,
        zeonMax: null,
        zeonMode: 'any',
        minIntMin: null,
        minIntMax: null,
        minIntMode: 'any',
        action: 'all',
        types: [],
      })
    ).toBe(true);
    expect(
      matchesFilters(mockSpell, {
        paths: [],
        maintenance: 'all',
        isAoe: null,
        levelMin: 15,
        levelMax: 20,
        zeonMin: null,
        zeonMax: null,
        zeonMode: 'any',
        minIntMin: null,
        minIntMax: null,
        minIntMode: 'any',
        action: 'all',
        types: [],
      })
    ).toBe(false);
  });

  it('matches level filter for free access by bracket overlap and multiple-of-10 rule', () => {
    const free = { ...mockSpell, id: 'f', name: 'F', category: 'free_access' as const, path: null, path_type: null, level: null, level_bracket: [1, 10] as [number, number] };
    const free50 = { ...free, id: 'f50', level_bracket: [50, 60] as [number, number] };
    const base = { paths: [] as string[], maintenance: 'all' as const, isAoe: null, levelMin: null, levelMax: null, zeonMin: null, zeonMax: null, zeonMode: 'any' as const, minIntMin: null, minIntMax: null, minIntMode: 'any' as const, action: 'all' as const, types: [] as string[] };
    expect(matchesFilters(free, { ...base, levelMin: 0, levelMax: 10 })).toBe(true);
    expect(matchesFilters(free, { ...base, levelMin: 10, levelMax: 20 })).toBe(false);
    expect(matchesFilters(free, { ...base, levelMin: 20, levelMax: 30 })).toBe(false);
    expect(matchesFilters(free, { ...base, levelMin: 5, levelMax: 10 })).toBe(false);
    expect(matchesFilters(free50, { ...base, levelMax: 50 })).toBe(false);
    expect(matchesFilters(free50, { ...base, levelMin: 50, levelMax: 60 })).toBe(true);
  });

  it('matches zeon filter with any mode', () => {
    // 'any' mode uses minimum zeon across grades (10, 20, 30, 40) = 10
    expect(
      matchesFilters(mockSpell, {
        paths: [],
        maintenance: 'all',
        isAoe: null,
        levelMin: null,
        levelMax: null,
        zeonMin: 5,
        zeonMax: 25,
        zeonMode: 'any',
        minIntMin: null,
        minIntMax: null,
        minIntMode: 'any',
        action: 'all',
        types: [],
      })
    ).toBe(true);
  });

  it('matches zeon filter with highest mode', () => {
    expect(
      matchesFilters(mockSpell, {
        paths: [],
        maintenance: 'all',
        isAoe: null,
        levelMin: null,
        levelMax: null,
        zeonMin: 35,
        zeonMax: 45,
        zeonMode: 'highest',
        minIntMin: null,
        minIntMax: null,
        minIntMode: 'any',
        action: 'all',
        types: [],
      })
    ).toBe(true);
  });
});

describe('search', () => {
  it('scores spell based on query', () => {
    const score = scoreSpell(mockSpell, 'test');
    expect(score).toBeGreaterThan(0);
  });

  it('returns 1 for empty query', () => {
    expect(scoreSpell(mockSpell, '')).toBe(1);
    expect(scoreSpell(mockSpell, '   ')).toBe(1);
  });

  it('matches name, effect, and grade descriptions per spec 2.3', () => {
    const base = { ...mockSpell, name: 'Other', effect: 'Nothing' };
    expect(
      scoreSpell(
        { ...base, effect: 'Creates fire' },
        'fire'
      )
    ).toBeGreaterThan(0);
    expect(
      scoreSpell(
        {
          ...base,
          grades: {
            ...base.grades,
            arcane: { ...base.grades.arcane, description: 'Arcane inferno blast' },
          },
        },
        'inferno'
      )
    ).toBeGreaterThan(0);
  });

  it('filters and sorts spells', () => {
    const results = filterAndSortSpells(
      [mockSpell],
      {
        paths: [],
        maintenance: 'all',
        isAoe: null,
        levelMin: null,
        levelMax: null,
        zeonMin: null,
        zeonMax: null,
        zeonMode: 'any',
        minIntMin: null,
        minIntMax: null,
        minIntMode: 'any',
        action: 'all',
        types: [],
      },
      'test',
      { field: 'default', direction: 'asc' }
    );
    expect(results.length).toBe(1);
  });
});

describe('sort', () => {
  it('creates comparator for name', () => {
    const cmp = createSortComparator('name', 'asc');
    expect(cmp({ name: 'A' }, { name: 'B' })).toBeLessThan(0);
    expect(cmp({ name: 'B' }, { name: 'A' })).toBeGreaterThan(0);
  });

  it('creates comparator for level', () => {
    const cmp = createSortComparator('level', 'asc');
    expect(cmp({ level: 5, category: 'main' }, { level: 10, category: 'main' })).toBeLessThan(0);
  });

  it('toggles sort direction', () => {
    expect(toggleSortDirection({ field: 'name', direction: 'asc' }, 'name')).toEqual({
      field: 'name',
      direction: 'desc',
    });
    expect(toggleSortDirection({ field: 'name', direction: 'desc' }, 'name')).toEqual({
      field: 'name',
      direction: 'asc',
    });
    expect(toggleSortDirection({ field: 'level', direction: 'asc' }, 'name')).toEqual({
      field: 'name',
      direction: 'asc',
    });
  });
});
