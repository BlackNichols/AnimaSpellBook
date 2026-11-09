import type { Spell, FilterState } from '@/stores/spellStore';
import { matchesFilters } from './filters';

export function scoreSpell(spell: Spell, query: string): number {
  if (!query.trim()) return 1;

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return 1;

  const searchableText = [
    spell.name,
    spell.effect,
    spell.grades.initial.description,
    spell.grades.intermediate.description,
    spell.grades.advanced.description,
    spell.grades.arcane.description,
  ]
    .join(' ')
    .toLowerCase();

  let score = 0;
  for (const term of terms) {
    if (searchableText.includes(term)) {
      // Boost for name matches
      if (spell.name.toLowerCase().includes(term)) score += 10;
      // Boost for exact word matches
      if (new RegExp(`\\b${term}\\b`).test(searchableText)) score += 5;
      score += 1;
    }
  }
  return score;
}

export function filterAndSortSpells(
  spells: Spell[],
  filters: FilterState,
  searchQuery: string,
  sort: { field: string; direction: 'asc' | 'desc' }
): Spell[] {
  let results = spells.filter(s => matchesFilters(s, filters));

  if (searchQuery.trim()) {
    results = results
      .map(s => ({ spell: s, score: scoreSpell(s, searchQuery) }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(r => r.spell);
  }

  // Apply sorting
  if (sort.field !== 'default') {
    results = [...results].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sort.field) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'level':
          aVal = a.category === 'free_access' ? a.level_bracket?.[0] ?? 0 : a.level ?? 0;
          bVal = b.category === 'free_access' ? b.level_bracket?.[0] ?? 0 : b.level ?? 0;
          break;
        case 'zeon':
          aVal = a.grades.arcane.zeon;
          bVal = b.grades.arcane.zeon;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return results;
}

// Re-export for use in store
export { matchesFilters } from './filters';
