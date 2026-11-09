import { describe, it, expect } from 'vitest';
import { SpellStore } from './spellStore';

describe('SpellStore.loadSpells', () => {
  it('loads all spells from bundled data without runtime fetch', async () => {
    const store = new SpellStore();
    await store.loadSpells();
    expect(store.spells.length).toBeGreaterThan(0);
    expect(store.filteredSpells.length).toBe(store.spells.length);
  });

  it('defaults visible columns to name, path, level, and effect (description)', async () => {
    const store = new SpellStore();
    await store.loadSpells();
    expect(store.columns.visible).toEqual(['name', 'path', 'level', 'effect']);
  });

  it('loads spells in default path/level/free-access order', async () => {
    const store = new SpellStore();
    await store.loadSpells();
    const cats = store.spells.map((s) => s.category);
    const firstSecondary = cats.indexOf('secondary');
    const firstFree = cats.indexOf('free_access');
    expect(cats.indexOf('main')).toBe(0);
    expect(firstSecondary).toBeGreaterThan(0);
    expect(firstFree).toBeGreaterThan(firstSecondary);
  });
});
