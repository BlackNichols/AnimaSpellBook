import type { SpellStore, FilterState } from '@/stores/spellStore';

export function FilterPanel(store: SpellStore) {
  const allPaths = ['free', 'path1', 'path2', 'path3'];
  const allTypes = ['Effect', 'Spiritual', 'Automatic', 'Defense', 'Detection', 'Attack'];

  return {
    openSections: {} as Record<string, boolean>,
    get filters() {
      return store.filters;
    },
    get paths() {
      return allPaths;
    },
    get types() {
      return allTypes;
    },
    isOpen(key: string) {
      return this.openSections[key] !== false;
    },
    toggleSection(key: string) {
      this.openSections[key] = !this.isOpen(key);
    },
    updatePaths(path: string, checked: boolean) {
      const paths = [...store.filters.paths];
      if (checked) paths.push(path);
      else paths.splice(paths.indexOf(path), 1);
      store.setFilters({ paths });
    },
    updateMaintenance(value: FilterState['maintenance']) {
      store.setFilters({ maintenance: value });
    },
    updateAoe(value: boolean | null) {
      store.setFilters({ isAoe: value });
    },
    updateLevelMin(value: number | null) {
      store.setFilters({ levelMin: value });
    },
    updateLevelMax(value: number | null) {
      store.setFilters({ levelMax: value });
    },
    updateZeonMin(value: number | null) {
      store.setFilters({ zeonMin: value });
    },
    updateZeonMax(value: number | null) {
      store.setFilters({ zeonMax: value });
    },
    updateZeonMode(value: FilterState['zeonMode']) {
      store.setFilters({ zeonMode: value });
    },
    updateMinIntMin(value: number | null) {
      store.setFilters({ minIntMin: value });
    },
    updateMinIntMax(value: number | null) {
      store.setFilters({ minIntMax: value });
    },
    updateMinIntMode(value: FilterState['minIntMode']) {
      store.setFilters({ minIntMode: value });
    },
    updateAction(value: FilterState['action']) {
      store.setFilters({ action: value });
    },
    updateTypes(type: string, checked: boolean) {
      const types = [...store.filters.types];
      if (checked) types.push(type);
      else types.splice(types.indexOf(type), 1);
      store.setFilters({ types });
    },
    clearAll() {
      store.setFilters({
        paths: [],
        maintenance: 'all',
        isAoe: null,
        levelMin: null,
        levelMax: null,
        zeonMin: null,
        zeonMax: null,
        zeonMode: 'any',
        minIntMin: null,
        minIntMax: null,
        minIntMode: 'any',
        action: 'all',
        types: [],
      });
    },
  };
}
