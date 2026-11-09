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

  it('starts filter sections minimized unless selected, and toggles', async () => {
    const store = new SpellStore();
    await store.loadSpells();
    const panel = FilterPanel(store) as any;
    expect(panel.isOpen('maintenance')).toBe(false);
    expect(panel.isOpen('action')).toBe(false);
    panel.toggleSection('maintenance');
    expect(panel.isOpen('maintenance')).toBe(true);
    panel.toggleSection('maintenance');
    expect(panel.isOpen('maintenance')).toBe(false);
    panel.updateMaintenance('daily');
    expect(panel.isActive('maintenance')).toBe(true);
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

  it('filters by Area of Effect', async () => {
    const store = new SpellStore();
    await store.loadSpells();
    const panel = FilterPanel(store) as any;
    panel.updateAoe(true);
    expect(store.filters.isAoe).toBe(true);
    expect(store.filteredSpells.every((s) => s.metadata.is_aoe)).toBe(true);
    panel.updateAoe(false);
    expect(store.filteredSpells.every((s) => !s.metadata.is_aoe)).toBe(true);
    panel.updateAoe(null);
    expect(store.filteredSpells.length).toBe(store.spells.length);
  });

  it('filters by action and by spell types', async () => {
    const store = new SpellStore();
    await store.loadSpells();
    const panel = FilterPanel(store) as any;
    panel.updateAction('Active');
    expect(store.filteredSpells.every((s) => s.action === 'Active')).toBe(true);
    panel.updateAction('Passive');
    expect(store.filteredSpells.every((s) => s.action === 'Passive')).toBe(true);
    panel.updateAction('all');
    panel.updateTypes('Attack', true);
    expect(store.filteredSpells.every((s) => s.types.includes('Attack'))).toBe(true);
    panel.updateTypes('Defense', true);
    expect(store.filteredSpells.every((s) => s.types.includes('Attack') || s.types.includes('Defense'))).toBe(true);
  });
});
