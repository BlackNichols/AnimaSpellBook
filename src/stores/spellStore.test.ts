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

  it('filters by search query and ranks name matches first', async () => {
    const store = new SpellStore();
    await store.loadSpells();
    const total = store.spells.length;
    store.setSearchQuery('fire');
    expect(store.filteredSpells.length).toBeGreaterThan(0);
    expect(store.filteredSpells.length).toBeLessThan(total);
    expect(store.filteredSpells[0]!.name.toLowerCase()).toContain('fire');
  });

  it('restores default order when search query is cleared', async () => {
    const store = new SpellStore();
    await store.loadSpells();
    const defaultIds = store.filteredSpells.map((s) => s.id);
    store.setSearchQuery('fire');
    store.setSearchQuery('');
    expect(store.filteredSpells.map((s) => s.id)).toEqual(defaultIds);
  });

  it('filters by maintenance and combines with search (AND)', async () => {
    const store = new SpellStore();
    await store.loadSpells();
    store.setFilters({ maintenance: 'daily' });
    expect(store.filteredSpells.length).toBeGreaterThan(0);
    expect(store.filteredSpells.every((s) => s.daily_maintenance)).toBe(true);

    const dailyCount = store.filteredSpells.length;
    store.setSearchQuery(store.filteredSpells[0]!.name);
    expect(store.filteredSpells.length).toBeLessThanOrEqual(dailyCount);
    expect(store.filteredSpells.every((s) => s.daily_maintenance)).toBe(true);

    store.setFilters({ maintenance: 'all' });
    store.setSearchQuery('');
  });
});
