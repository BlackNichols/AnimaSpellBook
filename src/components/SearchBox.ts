import type { SpellStore } from '@/stores/spellStore';

export function SearchBox(store: SpellStore) {
  return {
    get query() {
      return store.searchQuery;
    },
    set query(value: string) {
      store.setSearchQuery(value);
    },
    search() {
      store.setSearchQuery(store.searchQuery);
    },
  };
}