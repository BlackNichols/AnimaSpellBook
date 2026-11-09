import { describe, it, expect } from 'vitest';
import { SpellTable } from './SpellTable';
import { SpellStore } from '../stores/spellStore';

describe('SpellTable', () => {
  it('exposes all spells as rows with no filters/sort', async () => {
    const store = new SpellStore();
    await store.loadSpells();
    const table = SpellTable(store);
    expect(table.rows.length).toBe(store.spells.length);
  });

  it('shows name, path, level, and effect columns by default', async () => {
    const store = new SpellStore();
    await store.loadSpells();
    const table = SpellTable(store);
    expect(table.columns).toEqual(['name', 'path', 'level', 'effect']);
  });

  it('returns formatted path and level values for rows', async () => {
    const store = new SpellStore();
    await store.loadSpells();
    const table = SpellTable(store);
    const main = table.rows.find((r) => r.category === 'main')!;
    const free = table.rows.find((r) => r.category === 'free_access')!;
    expect(table.getField(main, 'name')).toBe(main.name);
    expect(table.getField(main, 'path')).toBe(main.path);
    expect(table.getField(main, 'level')).toBe(String(main.level));
    expect(table.getField(main, 'effect')).toBe(main.effect);
    expect(table.getField(free, 'path')).toBe('Free Access');
    expect(table.getField(free, 'level')).toBe(
      `${free.level_bracket?.[0]}-${free.level_bracket?.[1]}`
    );
  });
});
