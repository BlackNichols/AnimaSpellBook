import type { Spell, FilterState } from '@/stores/spellStore';
import { matchesFilters } from './filters';
import { compareSpellsDefault, createSortComparator } from './sort';

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
      if (spell.name.toLowerCase().includes(term)) score += 10;
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
  let results = spells.filter((s) => matchesFilters(s, filters));

  if (searchQuery.trim()) {
    results = results
      .map((s) => ({ spell: s, score: scoreSpell(s, searchQuery) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.spell);
    return results;
  }

  if (sort.field === 'default') {
    return [...results].sort(compareSpellsDefault);
  }

  return [...results].sort(createSortComparator(sort.field as never, sort.direction));
}

export { matchesFilters } from './filters';
