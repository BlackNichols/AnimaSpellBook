import type { Spell, FilterState } from '@/stores/spellStore';

export function matchesFilters(spell: Spell, filters: FilterState): boolean {
  // Path filter
  if (filters.paths.length > 0) {
    const spellPath = spell.path ?? 'free';
    if (!filters.paths.includes(spellPath)) return false;
  }

  // Maintenance filter
  if (filters.maintenance !== 'all') {
    const hasMaintenance =
      spell.grades.initial.maintenance !== null ||
      spell.grades.intermediate.maintenance !== null ||
      spell.grades.advanced.maintenance !== null ||
      spell.grades.arcane.maintenance !== null;
    const hasDailyMaintenance = spell.daily_maintenance;

    if (filters.maintenance === 'no' && hasMaintenance) return false;
    if (filters.maintenance === 'yes' && !hasMaintenance) return false;
    if (filters.maintenance === 'daily' && !hasDailyMaintenance) return false;
  }

  // AoE filter
  if (filters.isAoe !== null) {
    if (spell.metadata.is_aoe !== filters.isAoe) return false;
  }

  // Level filter
  if (filters.levelMin !== null || filters.levelMax !== null) {
    const min = filters.levelMin ?? -Infinity;
    const max = filters.levelMax ?? Infinity;

    if (spell.category === 'free_access') {
      if (!spell.level_bracket) return false;
      const [low, high] = spell.level_bracket;
      if (low > max || high < min) return false;
      // Exclude free access when filter value is not multiple of 10
      if (
        (filters.levelMin !== null && filters.levelMin % 10 !== 0) ||
        (filters.levelMax !== null && filters.levelMax % 10 !== 0)
      ) {
        return false;
      }
    } else {
      const level = spell.level ?? 0;
      if (level < min || level > max) return false;
    }
  }

  // Zeon cost filter
  if (filters.zeonMin !== null || filters.zeonMax !== null) {
    const min = filters.zeonMin ?? -Infinity;
    const max = filters.zeonMax ?? Infinity;
    const grades = ['initial', 'intermediate', 'advanced', 'arcane'] as const;
    const values = grades.map(g => spell.grades[g].zeon);
    const checkValue = filters.zeonMode === 'highest' ? Math.max(...values) : Math.min(...values);
    if (checkValue < min || checkValue > max) return false;
  }

  // Min Intelligence filter
  if (filters.minIntMin !== null || filters.minIntMax !== null) {
    const min = filters.minIntMin ?? -Infinity;
    const max = filters.minIntMax ?? Infinity;
    const grades = ['initial', 'intermediate', 'advanced', 'arcane'] as const;
    const values = grades.map(g => spell.grades[g].min_int);
    const checkValue = filters.minIntMode === 'highest' ? Math.max(...values) : Math.min(...values);
    if (checkValue < min || checkValue > max) return false;
  }

  // Action filter
  if (filters.action !== 'all') {
    if (spell.action !== filters.action) return false;
  }

  // Types filter
  if (filters.types.length > 0) {
    const hasType = filters.types.some((t: string) => spell.types.includes(t));
    if (!hasType) return false;
  }

  return true;
}
