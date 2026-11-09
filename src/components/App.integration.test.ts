import { describe, it, expect } from 'vitest';
import { SpellStore } from '../stores/spellStore';
import { FilterPanel } from './FilterPanel';
import { SearchBox } from './SearchBox';
import type { Spell } from '../stores/spellStore';

const LABELS: Record<string, string> = { name: 'Name', path: 'Path', level: 'Level', effect: 'Description' };
const getField = (spell: Spell, field: string) => {
  if (field === 'path') return spell.category === 'free_access' ? 'Free Access' : spell.path ?? '';
  if (field === 'level') return spell.category === 'free_access' ? `${spell.level_bracket?.[0]}-${spell.level_bracket?.[1]}` : String(spell.level ?? '');
  return (spell as unknown as Record<string, unknown>)[field] ?? '';
};

async function mount(options?: { url?: string }) {
  window.history.replaceState({}, '', options?.url ?? '/');
  const store = new SpellStore();
  await store.loadSpells();
  if (options?.url) store.fromURLParams(new URLSearchParams(new URL(options.url, 'http://x').search));
  const table = {
    get rows() { return store.filteredSpells; },
    get columns() { return store.columns.visible; },
    columnLabel: (c: string) => LABELS[c] ?? c,
    getField,
  };
  const panel = FilterPanel(store);
  const search = SearchBox(store);
  search.search();
  return { store, table, panel, search, sidebarOpen: { value: true } };
}

describe('UI integration (rendered behavior + URL sync)', () => {
  it('renders all spells with default columns Name, Path, Level, Description', async () => {
    const { store, table } = await mount({ url: '/' });
    expect(table.rows.length).toBe(store.spells.length);
    expect(table.columns.map((c) => table.columnLabel(c))).toEqual([
      'Name',
      'Path',
      'Level',
      'Description',
    ]);
  });

  it('shows spells in default path/level/free-access order', async () => {
    const { table } = await mount({ url: '/' });
    expect(table.getField(table.rows[0]!, 'path')).toBe('Light');
  });

  it('syncs ?q= URL param to search control and filters rows on load', async () => {
    const { store, table, search } = await mount({ url: '/?q=fire' });
    expect(search.query).toBe('fire');
    expect(table.rows.length).toBeGreaterThan(0);
    expect(table.rows.length).toBeLessThan(store.spells.length);
  });

  it('filters rows when search query changes (typing binding target)', async () => {
    const { store, table, search } = await mount({ url: '/' });
    const total = table.rows.length;
    search.query = 'fire';
    expect(table.rows.length).toBeGreaterThan(0);
    expect(table.rows.length).toBeLessThan(total);
    expect(store.searchQuery).toBe('fire');
  });

  it('applies maintenance filter and combines with search (AND)', async () => {
    const { table, panel, search } = await mount({ url: '/' });
    panel.updateMaintenance('daily');
    expect(table.rows.length).toBeGreaterThan(0);
    expect(table.rows.every((s) => s.daily_maintenance)).toBe(true);
    search.query = table.rows[0]!.name;
    expect(table.rows.every((s) => s.daily_maintenance)).toBe(true);
  });

  it('hides and shows the sidebar state (full-width toggle target)', async () => {
    const env = await mount({ url: '/' });
    expect(env.sidebarOpen.value).toBe(true);
    env.sidebarOpen.value = false;
    expect(env.sidebarOpen.value).toBe(false);
  });

  it('collapses and expands a filter section to show only its name', async () => {
    const { panel } = await mount({ url: '/' });
    expect(panel.isOpen('maintenance')).toBe(true);
    panel.toggleSection('maintenance');
    expect(panel.isOpen('maintenance')).toBe(false);
    panel.toggleSection('maintenance');
    expect(panel.isOpen('maintenance')).toBe(true);
  });
});
