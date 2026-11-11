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

  it('filters by level range (main and free-access brackets)', async () => {
    const store = new SpellStore();
    await store.loadSpells();
    const panel = FilterPanel(store) as any;
    panel.updateLevelMin(1);
    panel.updateLevelMax(10);
    expect(panel.isActive('level')).toBe(true);
    expect(store.filteredSpells.every((s) => {
      if (s.category === 'free_access') return (s.level_bracket?.[0] ?? 99) <= 10 && (s.level_bracket?.[1] ?? 0) >= 1;
      return (s.level ?? 0) >= 1 && (s.level ?? 0) <= 10;
    })).toBe(true);
    panel.updateLevelMin(null);
    panel.updateLevelMax(null);
    expect(store.filteredSpells.length).toBe(store.spells.length);
  });

  it('filters by zeon cost range and mode', async () => {
    const store = new SpellStore();
    await store.loadSpells();
    const panel = FilterPanel(store) as any;
    panel.updateZeonMin(35);
    panel.updateZeonMax(45);
    panel.updateZeonMode('any');
    expect(panel.isActive('zeon')).toBe(true);
    expect(store.filteredSpells.length).toBeGreaterThan(0);
    expect(store.filteredSpells.every((s) => {
      const v = Math.min(s.grades.initial.zeon, s.grades.intermediate.zeon, s.grades.advanced.zeon, s.grades.arcane.zeon);
      return v >= 35 && v <= 45;
    })).toBe(true);
    panel.updateZeonMin(null);
    panel.updateZeonMax(null);
    expect(store.filters.zeonMode).toBe('any');
  });
});
