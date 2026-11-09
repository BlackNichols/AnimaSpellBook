import { describe, it, expect } from 'vitest';
import { SearchBox } from './SearchBox';
import { SpellStore } from '../stores/spellStore';

describe('SearchBox', () => {
  it('reflects store query and updates store when changed', async () => {
    const store = new SpellStore();
    await store.loadSpells();
    const total = store.filteredSpells.length;

    const box = SearchBox(store) as { query: string; search: () => void };
    expect(box.query).toBe('');

    store.setSearchQuery('gnosis');
    expect(box.query).toBe('gnosis');

    box.query = 'fire';
    expect(store.searchQuery).toBe('fire');
    expect(store.filteredSpells.length).toBeLessThan(total);
  });
});
