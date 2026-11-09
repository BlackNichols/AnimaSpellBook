import type { SpellStore } from '@/stores/spellStore';

interface AlpineComponent {
  $watch(key: string, callback: (value: string) => void): void;
}

export function SearchBox(store: SpellStore) {
  return {
    query: '',
    init() {
      this.query = store.searchQuery;
      (this as unknown as AlpineComponent).$watch('query', (val: string) => {
        store.setSearchQuery(val);
      });
    },
  };
}