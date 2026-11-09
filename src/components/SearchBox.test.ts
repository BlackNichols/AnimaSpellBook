import { describe, it, expect } from 'vitest';
import { SearchBox } from './SearchBox';
import { SpellStore } from '../stores/spellStore';

describe('SearchBox', () => {
  it('initializes from store query and updates store on change', async () => {
    const store = new SpellStore();
    await store.loadSpells();
    const total = store.filteredSpells.length;

    let watched: ((v: string) => void) | undefined;
    const box = SearchBox(store) as {
      query: string;
      init: () => void;
      search: () => void;
      $watch: (k: string, cb: (v: string) => void) => void;
    };
    box.$watch = (_k, cb) => {
      watched = cb;
    };
    box.init();
    expect(box.query).toBe('');

    box.query = 'fire';
    watched?.('fire');
    expect(store.searchQuery).toBe('fire');
    expect(store.filteredSpells.length).toBeLessThan(total);
  });
});
