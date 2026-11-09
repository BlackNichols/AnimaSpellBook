import type { FilterState, SortState } from '@/stores/spellStore';

export function serializeFilters(filters: FilterState): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.paths.length) params.paths = filters.paths.join(',');
  if (filters.maintenance !== 'all') params.maintenance = filters.maintenance;
  if (filters.isAoe !== null) params.aoe = String(filters.isAoe);
  if (filters.levelMin !== null) params.levelMin = String(filters.levelMin);
  if (filters.levelMax !== null) params.levelMax = String(filters.levelMax);
  if (filters.zeonMin !== null) params.zeonMin = String(filters.zeonMin);
  if (filters.zeonMax !== null) params.zeonMax = String(filters.zeonMax);
  if (filters.zeonMode !== 'any') params.zeonMode = filters.zeonMode;
  if (filters.minIntMin !== null) params.minIntMin = String(filters.minIntMin);
  if (filters.minIntMax !== null) params.minIntMax = String(filters.minIntMax);
  if (filters.minIntMode !== 'any') params.minIntMode = filters.minIntMode;
  if (filters.action !== 'all') params.action = filters.action;
  if (filters.types.length) params.types = filters.types.join(',');
  return params;
}

export function deserializeFilters(params: URLSearchParams): Partial<FilterState> {
  const filters: Partial<FilterState> = {};

  const paths = params.get('paths');
  if (paths) filters.paths = paths.split(',');

  const maintenance = params.get('maintenance');
  if (maintenance) filters.maintenance = maintenance as FilterState['maintenance'];

  const aoe = params.get('aoe');
  if (aoe !== null) filters.isAoe = aoe === 'true';

  const levelMin = params.get('levelMin');
  if (levelMin !== null) filters.levelMin = parseInt(levelMin, 10);

  const levelMax = params.get('levelMax');
  if (levelMax !== null) filters.levelMax = parseInt(levelMax, 10);

  const zeonMin = params.get('zeonMin');
  if (zeonMin !== null) filters.zeonMin = parseInt(zeonMin, 10);

  const zeonMax = params.get('zeonMax');
  if (zeonMax !== null) filters.zeonMax = parseInt(zeonMax, 10);

  const zeonMode = params.get('zeonMode');
  if (zeonMode) filters.zeonMode = zeonMode as FilterState['zeonMode'];

  const minIntMin = params.get('minIntMin');
  if (minIntMin !== null) filters.minIntMin = parseInt(minIntMin, 10);

  const minIntMax = params.get('minIntMax');
  if (minIntMax !== null) filters.minIntMax = parseInt(minIntMax, 10);

  const minIntMode = params.get('minIntMode');
  if (minIntMode) filters.minIntMode = minIntMode as FilterState['minIntMode'];

  const action = params.get('action');
  if (action) filters.action = action as FilterState['action'];

  const types = params.get('types');
  if (types) filters.types = types.split(',');

  return filters;
}

export function serializeSort(sort: SortState): string | null {
  if (sort.field === 'default') return null;
  return `${sort.field}:${sort.direction}`;
}

export function deserializeSort(value: string | null): SortState | null {
  if (!value) return null;
  const [field, direction] = value.split(':');
  return { field: field as SortState['field'], direction: direction as SortState['direction'] };
}

export function serializeColumns(columns: string[]): string | null {
  // Default is ['name', 'description']
  if (columns.length === 2 && columns[0] === 'name' && columns[1] === 'description') return null;
  return columns.join(',');
}

export function deserializeColumns(value: string | null): string[] {
  if (!value) return ['name', 'description'];
  return value.split(',');
}
