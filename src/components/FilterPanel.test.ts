import { describe, it, expect } from 'vitest';
import { FilterPanel } from './FilterPanel';
import { SpellStore } from '../stores/spellStore';

describe('FilterPanel', () => {
  it('updates store maintenance filter', async () => {
    const store = new SpellStore();
    await store.loadSpells();
    const panel = FilterPanel(store) as any;
    panel.updateMaintenance('daily');
    expect(panel.filters.maintenance).toBe('daily');
    expect(store.filteredSpells.every((s) => s.daily_maintenance)).toBe(true);
  });

  it('toggles a filter section collapsed state', async () => {
    const store = new SpellStore();
    await store.loadSpells();
    const panel = FilterPanel(store) as any;
    expect(panel.isOpen('maintenance')).toBe(true);
    panel.toggleSection('maintenance');
    expect(panel.isOpen('maintenance')).toBe(false);
  });

  it('filters by path and by free access (category+path groups)', async () => {
    const store = new SpellStore();
    await store.loadSpells();
    const panel = FilterPanel(store) as any;
    panel.updatePath('Fire', true);
    expect(store.filteredSpells.length).toBeGreaterThan(0);
    expect(store.filteredSpells.every((s) => s.path === 'Fire')).toBe(true);
    panel.updatePath('Fire', false);
    panel.updatePath('free_access', true);
    expect(store.filteredSpells.every((s) => s.category === 'free_access')).toBe(true);
  });

  it('toggles a whole category path group', async () => {
    const store = new SpellStore();
    await store.loadSpells();
    const panel = FilterPanel(store) as any;
    panel.toggleCategory('main', true);
    expect(store.filters.paths).toContain('Fire');
    expect(store.filteredSpells.every((s) => s.category === 'main')).toBe(true);
    panel.toggleCategory('main', false);
    expect(store.filters.paths.filter((p: string) => p === 'Fire').length).toBe(0);
  });
});
