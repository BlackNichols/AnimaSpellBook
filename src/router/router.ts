import type { SpellStore } from '@/stores/spellStore';

export type RouteView = 'spelllist' | 'spellbooks';

export interface RouteState {
  view: RouteView;
  path: string;
  search: string;
}

export type ResolveResult =
  | { type: 'redirect'; to: string }
  | { type: 'route'; view: RouteView };

function normalizePath(pathname: string): string {
  if (!pathname) return '/';
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function parseUrl(url: string): { pathname: string; search: string } {
  const q = url.indexOf('?');
  if (q === -1) return { pathname: normalizePath(url || '/'), search: '' };
  return { pathname: normalizePath(url.slice(0, q) || '/'), search: url.slice(q) };
}

function viewForPath(pathname: string): RouteView | null {
  if (pathname === '/spelllist') return 'spelllist';
  if (pathname === '/spellbooks') return 'spellbooks';
  return null;
}

export function createRouter(store: SpellStore) {
  let savedListSearch = '';
  let started = false;
  let suppressStoreSync = false;

  const route: RouteState = { view: 'spelllist', path: '/spelllist', search: '' };

  function setRoute(view: RouteView, path: string, search: string) {
    route.view = view;
    route.path = path;
    route.search = search;
  }

  function resolve(url: string): ResolveResult {
    const { pathname, search } = parseUrl(url);
    if (pathname === '/' || pathname === '') {
      return { type: 'redirect', to: `/spelllist${search}` };
    }
    const view = viewForPath(pathname);
    if (view) return { type: 'route', view };
    // Chunk 1 baseline: unknown paths treated as redirect to spelllist (preserve none)
    return { type: 'redirect', to: '/spelllist' };
  }

  function applyListParams(search: string) {
    suppressStoreSync = true;
    try {
      store.fromURLParams(new URLSearchParams(search.startsWith('?') ? search.slice(1) : search));
    } finally {
      suppressStoreSync = false;
    }
  }

  function syncUrlFromStore() {
    if (!started || suppressStoreSync) return;
    if (route.view !== 'spelllist') return;
    const params = store.toURLParams();
    const search = params.toString() ? `?${params.toString()}` : '';
    route.search = search;
    savedListSearch = search;
    const url = `/spelllist${search}`;
    window.history.replaceState({}, '', url);
  }

  function enter(pathname: string, search: string, mode: 'push' | 'replace') {
    const view = viewForPath(pathname) ?? 'spelllist';
    if (view === 'spelllist') {
      const effectiveSearch = search || (route.view !== 'spelllist' ? savedListSearch : '');
      applyListParams(effectiveSearch);
      savedListSearch = effectiveSearch;
      setRoute('spelllist', '/spelllist', effectiveSearch);
      const url = `/spelllist${effectiveSearch}`;
      if (mode === 'push') window.history.pushState({}, '', url);
      else window.history.replaceState({}, '', url);
    } else {
      // leaving spelllist: preserve current list params snapshot
      if (route.view === 'spelllist') {
        const params = store.toURLParams();
        savedListSearch = params.toString() ? `?${params.toString()}` : route.search;
      }
      setRoute(view, pathname, '');
      const url = pathname;
      if (mode === 'push') window.history.pushState({}, '', url);
      else window.history.replaceState({}, '', url);
    }
  }

  function handleLocation(mode: 'push' | 'replace') {
    const { pathname, search } = parseUrl(window.location.pathname + window.location.search);
    const res = resolve(pathname + search);
    if (res.type === 'redirect') {
      window.history.replaceState({}, '', res.to);
      const next = parseUrl(res.to);
      enter(next.pathname, next.search, 'replace');
      return;
    }
    enter(pathname, search, mode);
  }

  function navigate(path: string) {
    const { pathname, search } = parseUrl(path);
    const res = resolve(pathname + search);
    if (res.type === 'redirect') {
      window.history.pushState({}, '', res.to);
      const next = parseUrl(res.to);
      enter(next.pathname, next.search, 'replace');
      return;
    }
    enter(pathname, search, 'push');
  }

  function start() {
    if (started) return;
    started = true;
    // initialize saved params from current URL if on spelllist-like entry handled after resolve
    store.subscribe(syncUrlFromStore);
    window.addEventListener('popstate', () => {
      handleLocation('replace');
    });
    handleLocation('replace');
  }

  function clearFilters() {
    suppressStoreSync = true;
    try {
      store.setSearchQuery('');
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
    } finally {
      suppressStoreSync = false;
    }
    if (route.view === 'spelllist') {
      savedListSearch = '';
      route.search = '';
      window.history.replaceState({}, '', '/spelllist');
    } else {
      savedListSearch = '';
      navigate('/spelllist');
    }
  }

  return {
    route,
    resolve,
    start,
    navigate,
    clearFilters,
  };
}
