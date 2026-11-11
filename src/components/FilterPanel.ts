import type { SpellStore, FilterState, Spell } from '@/stores/spellStore';
import { MAIN_PATH_ORDER, SECONDARY_PATH_ORDER } from '@/utils/sort';

export function FilterPanel(store: SpellStore) {
  const categories: { key: 'main' | 'secondary'; label: string; paths: readonly string[] }[] = [
    { key: 'main', label: 'Main', paths: MAIN_PATH_ORDER },
    { key: 'secondary', label: 'Secondary', paths: SECONDARY_PATH_ORDER },
  ];

  const allTypes = ['Attack', 'Defense', 'Effect', 'Detection', 'Automatic', 'Spiritual'] as const;

  const keys = ['category', 'level', 'action', 'types', 'aoe', 'maintenance', 'zeon'];
  const initialOpen: Record<string, boolean> = {};
  const getFilters = () => store.filters;
  const isActive = (key: string) => {
    const f = getFilters();
    if (key === 'category') return f.paths.length > 0;
    if (key === 'action') return f.action !== 'all';
    if (key === 'types') return f.types.length > 0;
    if (key === 'aoe') return f.isAoe !== null;
    if (key === 'maintenance') return f.maintenance !== 'all';
    if (key === 'level') return f.levelMin !== null || f.levelMax !== null;
    if (key === 'zeon') return f.zeonMin !== null || f.zeonMax !== null || f.zeonMode !== 'any';
    return false;
  };
  for (const k of keys) {
    if (isActive(k)) initialOpen[k] = true;
  }

  return {
    openSections: initialOpen as Record<string, boolean>,
    get filters() {
      return store.filters;
    },
    get categories() {
      return categories;
    },
    get types() {
      return allTypes;
    },
    get availablePaths() {
      const seen = new Set<string>();
      for (const s of store.spells as Spell[]) if (s.path) seen.add(s.path);
      return categories.map((c) => ({
        ...c,
        paths: c.paths.filter((p) => seen.size === 0 || seen.has(p)),
      }));
    },
    isActive,
    isOpen(key: string) {
      if (Object.prototype.hasOwnProperty.call(this.openSections, key)) {
        return this.openSections[key] === true;
      }
      return isActive(key);
    },
    toggleSection(key: string) {
      const next = !this.isOpen(key);
      this.openSections = { ...this.openSections, [key]: next };
    },
    isPathSelected(path: string) {
      return store.filters.paths.includes(path);
    },
    updatePath(path: string, checked: boolean) {
      const paths = [...store.filters.paths];
      if (checked) {
        if (!paths.includes(path)) paths.push(path);
      } else {
        const i = paths.indexOf(path);
        if (i >= 0) paths.splice(i, 1);
      }
      store.setFilters({ paths });
    },
    toggleCategory(key: 'main' | 'secondary', checked: boolean) {
      const group = categories.find((c) => c.key === key)?.paths ?? [];
      const paths = store.filters.paths.filter((p) => !group.includes(p));
      if (checked) paths.push(...group);
      store.setFilters({ paths });
    },
    categoryState(key: 'main' | 'secondary') {
      const group = categories.find((c) => c.key === key)?.paths ?? [];
      const n = group.filter((p) => store.filters.paths.includes(p)).length;
      if (n === 0) return 'none';
      if (n === group.length) return 'all';
      return 'some';
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
