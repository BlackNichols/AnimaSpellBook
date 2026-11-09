import { describe, it, expect } from 'vitest';
import { compareSpellsDefault } from '@/utils/sort';

function s(overrides: {
  id?: string;
  name?: string;
  category: 'main' | 'secondary' | 'free_access';
  path: string | null;
  level?: number | null;
  level_bracket?: [number, number] | null;
}) {
  return {
    id: overrides.id ?? overrides.name ?? 'x',
    name: overrides.name ?? 'Spell',
    category: overrides.category,
    path: overrides.path,
    level: overrides.level ?? null,
    level_bracket: overrides.level_bracket ?? null,
  };
}

describe('compareSpellsDefault', () => {
  it('orders main paths before secondary before free access', () => {
    const main = s({ category: 'main', path: 'Fire', level: 2, name: 'A' });
    const secondary = s({ category: 'secondary', path: 'Chaos', level: 4, name: 'B' });
    const free = s({ category: 'free_access', path: null, level_bracket: [1, 10], name: 'C' });
    const sorted = [free, secondary, main].sort(compareSpellsDefault);
    expect(sorted.map((x) => x.category)).toEqual(['main', 'secondary', 'free_access']);
  });

  it('orders main paths by configured order', () => {
    const light = s({ category: 'main', path: 'Light', level: 2, name: 'L' });
    const necro = s({ category: 'main', path: 'Necromancy', level: 2, name: 'N' });
    const fire = s({ category: 'main', path: 'Fire', level: 2, name: 'F' });
    const sorted = [necro, fire, light].sort(compareSpellsDefault);
    expect(sorted.map((x) => x.path)).toEqual(['Light', 'Fire', 'Necromancy']);
  });

  it('orders secondary paths by configured order', () => {
    const chaos = s({ category: 'secondary', path: 'Chaos', level: 4, name: 'C' });
    const void_ = s({ category: 'secondary', path: 'Void', level: 4, name: 'V' });
    const death = s({ category: 'secondary', path: 'Death', level: 4, name: 'D' });
    const sorted = [void_, death, chaos].sort(compareSpellsDefault);
    expect(sorted.map((x) => x.path)).toEqual(['Chaos', 'Death', 'Void']);
  });

  it('orders spells by level within same path', () => {
    const a = s({ category: 'main', path: 'Fire', level: 20, name: 'A' });
    const b = s({ category: 'main', path: 'Fire', level: 2, name: 'B' });
    const c = s({ category: 'main', path: 'Fire', level: 10, name: 'C' });
    const sorted = [a, b, c].sort(compareSpellsDefault);
    expect(sorted.map((x) => x.level)).toEqual([2, 10, 20]);
  });

  it('orders free access by bracket then name', () => {
    const a = s({ category: 'free_access', path: null, level_bracket: [10, 20], name: 'Beta' });
    const b = s({ category: 'free_access', path: null, level_bracket: [1, 10], name: 'Zulu' });
    const c = s({ category: 'free_access', path: null, level_bracket: [10, 20], name: 'Alpha' });
    const sorted = [a, b, c].sort(compareSpellsDefault);
    expect(sorted.map((x) => [x.level_bracket?.[0], x.name])).toEqual([
      [1, 'Zulu'],
      [10, 'Alpha'],
      [10, 'Beta'],
    ]);
  });

  it('keeps free access after all path spells', () => {
    const spells = [
      s({ category: 'free_access', path: null, level_bracket: [1, 10], name: 'F' }),
      s({ category: 'secondary', path: 'Void', level: 94, name: 'S' }),
      s({ category: 'main', path: 'Necromancy', level: 100, name: 'M' }),
    ].sort(compareSpellsDefault);
    expect(spells[2]!.category).toBe('free_access');
  });
});
