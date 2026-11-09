import { describe, it, expect } from 'vitest';
import { FilterPanel } from './FilterPanel';
import { SpellStore } from '../stores/spellStore';

describe('FilterPanel maintenance', () => {
  it('updates store maintenance filter', async () => {
    const store = new SpellStore();
    await store.loadSpells();
    const panel = FilterPanel(store) as {
      filters: { maintenance: string };
      updateMaintenance: (v: 'all' | 'no' | 'yes' | 'daily') => void;
    };

    panel.updateMaintenance('daily');
    expect(panel.filters.maintenance).toBe('daily');
    expect(store.filters.maintenance).toBe('daily');
    expect(store.filteredSpells.every((s) => s.daily_maintenance)).toBe(true);
  });

  it('toggles a filter section collapsed state', async () => {
    const store = new SpellStore();
    await store.loadSpells();
    const panel = FilterPanel(store) as {
      isOpen: (key: string) => boolean;
      toggleSection: (key: string) => void;
    };

    expect(panel.isOpen('maintenance')).toBe(true);
    panel.toggleSection('maintenance');
    expect(panel.isOpen('maintenance')).toBe(false);
    panel.toggleSection('maintenance');
    expect(panel.isOpen('maintenance')).toBe(true);
  });
});
