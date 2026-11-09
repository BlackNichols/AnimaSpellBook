import { compareSpellsDefault } from '@/utils/sort';
import { filterAndSortSpells } from '@/utils/search';

const spellModules = import.meta.glob('../../data/spells/**/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Spell[]>;

export interface Spell {
  id: string;
  name: string;
  category: 'main' | 'secondary' | 'free_access';
  path: string | null;
  path_type: 'major' | 'minor' | null;
  level: number | null;
  level_bracket: [number, number] | null;
  action: 'Active' | 'Passive';
  types: string[];
  daily_maintenance: boolean;
  effect: string;
  grades: {
    initial: Grade;
    intermediate: Grade;
    advanced: Grade;
    arcane: Grade;
  };
  metadata: {
    is_aoe: boolean;
    resistance_cap: number | null;
    resistance_types: string[];
    tags: string[];
  };
}

export interface Grade {
  zeon: number;
  min_int: number;
  maintenance: number | null;
  resistance: string | null;
  resistance_types: string[];
  description: string;
}

export type MaintenanceFilter = 'all' | 'no' | 'yes' | 'daily';
export type AoeFilter = boolean | null;
export type ZeonMode = 'any' | 'highest';
export type MinIntMode = 'any' | 'highest';
export type ActionFilter = 'all' | 'Active' | 'Passive';
export type SortField = 'default' | 'name' | 'level' | 'zeon';
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  paths: string[];
  maintenance: MaintenanceFilter;
  isAoe: AoeFilter;
  levelMin: number | null;
  levelMax: number | null;
  zeonMin: number | null;
  zeonMax: number | null;
  zeonMode: ZeonMode;
  minIntMin: number | null;
  minIntMax: number | null;
  minIntMode: MinIntMode;
  action: ActionFilter;
  types: string[];
}

export interface SortState {
  field: SortField;
  direction: SortDirection;
}

export interface ColumnState {
  visible: string[];
  all: string[];
}

function loadBundledSpells(): Spell[] {
  return Object.values(spellModules).flat().sort(compareSpellsDefault);
}

export class SpellStore {
  spells: Spell[] = [];
  filteredSpells: Spell[] = [];
  filters: FilterState = {
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
  };
  searchQuery = '';
  sort: SortState = { field: 'default', direction: 'asc' };
  columns: ColumnState = {
    visible: ['name', 'path', 'level', 'effect'],
    all: [],
  };

  private subscribers: Set<() => void> = new Set();

  subscribe(fn: () => void) {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  private notify() {
    this.subscribers.forEach((fn) => fn());
  }

  async loadSpells() {
    this.spells = loadBundledSpells();
    this.columns.all = this.getAllSpellFields();
    this.applyFilters();
  }

  private getAllSpellFields(): string[] {
    if (this.spells.length === 0) return [];
    const sample = this.spells[0]!;
    const fields = new Set<string>();
    Object.keys(sample).forEach((key) => {
      if (key !== 'grades' && key !== 'metadata') fields.add(key);
    });
    const gradeKeys = [
      'zeon',
      'min_int',
      'maintenance',
      'resistance',
      'resistance_types',
      'description',
    ];
    const grades = ['initial', 'intermediate', 'advanced', 'arcane'];
    grades.forEach((g) => gradeKeys.forEach((k) => fields.add(`${g}_${k}`)));
    Object.keys(sample.metadata || {}).forEach((key) => fields.add(`metadata_${key}`));
    return Array.from(fields).sort();
  }

  setFilters(filters: Partial<FilterState>) {
    this.filters = { ...this.filters, ...filters };
    this.applyFilters();
  }

  setSearchQuery(query: string) {
    this.searchQuery = query;
    this.applyFilters();
  }

  setSort(field: SortState['field'], direction?: SortState['direction']) {
    this.sort = { field, direction: direction ?? this.sort.direction };
    this.applyFilters();
  }

  toggleSort(field: SortState['field']) {
    if (this.sort.field === field) {
      this.sort.direction = this.sort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sort = { field, direction: 'asc' };
    }
    this.applyFilters();
  }

  setColumns(visible: string[]) {
    this.columns.visible = visible;
    this.notify();
  }

  toggleColumn(field: string) {
    const idx = this.columns.visible.indexOf(field);
    if (idx >= 0) this.columns.visible.splice(idx, 1);
    else this.columns.visible.push(field);
    this.notify();
  }

  getFilterState(): FilterState {
    return { ...this.filters };
  }

  getSortState(): SortState {
    return { ...this.sort };
  }

  getColumnState(): ColumnState {
    return { ...this.columns, visible: [...this.columns.visible] };
  }

  applyFilters() {
    this.filteredSpells = filterAndSortSpells(
      this.spells,
      this.filters,
      this.searchQuery,
      this.sort
    );
    this.notify();
  }

  toURLParams(): URLSearchParams {
    const params = new URLSearchParams();
    if (this.searchQuery) params.set('q', this.searchQuery);
    if (this.filters.paths.length) params.set('paths', this.filters.paths.join(','));
    if (this.filters.maintenance !== 'all') params.set('maintenance', this.filters.maintenance);
    if (this.filters.isAoe !== null) params.set('aoe', String(this.filters.isAoe));
    if (this.filters.levelMin !== null) params.set('levelMin', String(this.filters.levelMin));
    if (this.filters.levelMax !== null) params.set('levelMax', String(this.filters.levelMax));
    if (this.filters.zeonMin !== null) params.set('zeonMin', String(this.filters.zeonMin));
    if (this.filters.zeonMax !== null) params.set('zeonMax', String(this.filters.zeonMax));
    if (this.filters.zeonMode !== 'any') params.set('zeonMode', this.filters.zeonMode);
    if (this.filters.minIntMin !== null) params.set('minIntMin', String(this.filters.minIntMin));
    if (this.filters.minIntMax !== null) params.set('minIntMax', String(this.filters.minIntMax));
    if (this.filters.minIntMode !== 'any') params.set('minIntMode', this.filters.minIntMode);
    if (this.filters.action !== 'all') params.set('action', this.filters.action);
    if (this.filters.types.length) params.set('types', this.filters.types.join(','));
    if (this.sort.field !== 'default')
      params.set('sort', `${this.sort.field}:${this.sort.direction}`);
    if (
      this.columns.visible.length !== 4 ||
      this.columns.visible[0] !== 'name' ||
      this.columns.visible[1] !== 'path' ||
      this.columns.visible[2] !== 'level' ||
      this.columns.visible[3] !== 'effect'
    ) {
      params.set('cols', this.columns.visible.join(','));
    }
    return params;
  }

  fromURLParams(params: URLSearchParams) {
    const q = params.get('q');
    if (q !== null) this.searchQuery = q;

    const paths = params.get('paths');
    if (paths) this.filters.paths = paths.split(',');

    const maintenance = params.get('maintenance');
    if (maintenance) this.filters.maintenance = maintenance as FilterState['maintenance'];

    const aoe = params.get('aoe');
    if (aoe !== null) this.filters.isAoe = aoe === 'true';

    const levelMin = params.get('levelMin');
    if (levelMin !== null) this.filters.levelMin = parseInt(levelMin, 10);

    const levelMax = params.get('levelMax');
    if (levelMax !== null) this.filters.levelMax = parseInt(levelMax, 10);

    const zeonMin = params.get('zeonMin');
    if (zeonMin !== null) this.filters.zeonMin = parseInt(zeonMin, 10);

    const zeonMax = params.get('zeonMax');
    if (zeonMax !== null) this.filters.zeonMax = parseInt(zeonMax, 10);

    const zeonMode = params.get('zeonMode');
    if (zeonMode) this.filters.zeonMode = zeonMode as FilterState['zeonMode'];

    const minIntMin = params.get('minIntMin');
    if (minIntMin !== null) this.filters.minIntMin = parseInt(minIntMin, 10);

    const minIntMax = params.get('minIntMax');
    if (minIntMax !== null) this.filters.minIntMax = parseInt(minIntMax, 10);

    const minIntMode = params.get('minIntMode');
    if (minIntMode) this.filters.minIntMode = minIntMode as FilterState['minIntMode'];

    const action = params.get('action');
    if (action) this.filters.action = action as FilterState['action'];

    const types = params.get('types');
    if (types) this.filters.types = types.split(',');

    const sort = params.get('sort');
    if (sort) {
      const [field, direction] = sort.split(':');
      this.sort = {
        field: field as SortState['field'],
        direction: direction as SortState['direction'],
      };
    }

    const cols = params.get('cols');
    if (cols) this.columns.visible = cols.split(',');

    this.applyFilters();
  }
}
