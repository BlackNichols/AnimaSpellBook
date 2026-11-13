import type { SpellStore } from '@/stores/spellStore';
import type { SpellbookStore } from '@/stores/spellbookStore';

export type RouteView = 'spelllist' | 'spellbooks' | 'spellbook';

export interface RouteState {
  view: RouteView;
  path: string;
  search: string;
  spellbookId: string | null;
}

export type ResolveResult =
  | { type: 'redirect'; to: string }
  | { type: 'route'; view: RouteView; spellbookId?: string };

export interface RouterOptions {
  base?: string;
  spellbookStore?: SpellbookStore;
}

function normalizeBase(base: string | undefined): string {
  if (!base || base === '/') return '/';
  let b = base;
  if (!b.startsWith('/')) b = `/${b}`;
  if (!b.endsWith('/')) b = `${b}/`;
  return b;
}

function normalizePath(pathname: string): string {
  if (!pathname) return '/';
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function parseUrl(url: string): { pathname: string; search: string } {
  const q = url.indexOf('?');
  if (q === -1) return { pathname: normalizePath(url || '/'), search: '' };
  return { pathname: normalizePath(url.slice(0, q) || '/'), search: url.slice(q) };
}

function matchPath(pathname: string): { view: RouteView; spellbookId?: string } | null {
  if (pathname === '/spelllist') return { view: 'spelllist' };
  if (pathname === '/spellbooks') return { view: 'spellbooks' };
  const m = /^\/spellbooks\/([^/]+)$/.exec(pathname);
  if (m) return { view: 'spellbook', spellbookId: m[1] };
  return null;
}

export function createRouter(store: SpellStore, options: RouterOptions = {}) {
  const base = normalizeBase(options.base);
  const spellbookStore = options.spellbookStore;
  let savedListSearch = '';
  let started = false;
  let suppressStoreSync = false;
  const listeners = new Set<() => void>();

  const route: RouteState = { view: 'spelllist', path: '/spelllist', search: '', spellbookId: null };

  function stripBase(pathname: string): string {
    const p = normalizePath(pathname);
    if (base === '/') return p || '/';
    const baseNoSlash = base.slice(0, -1);
    if (p === baseNoSlash) return '/';
    if (p.startsWith(base)) return normalizePath(`/${p.slice(base.length)}`);
    return p;
  }

  function withBase(appPath: string): string {
    const { pathname, search } = parseUrl(appPath);
    if (base === '/') return `${pathname}${search}`;
    const baseNoSlash = base.slice(0, -1);
    const full = pathname === '/' ? baseNoSlash : `${baseNoSlash}${pathname}`;
    return `${full}${search}`;
  }

  function notify() {
    for (const cb of listeners) cb();
  }

  function onRouteChange(cb: () => void): () => void {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }

  function setRoute(view: RouteView, path: string, search: string, spellbookId: string | null = null) {
    route.view = view;
    route.path = path;
    route.search = search;
    route.spellbookId = spellbookId;
    notify();
  }

  function resolve(url: string): ResolveResult {
    const { pathname: rawPath, search } = parseUrl(url);
    const pathname = stripBase(rawPath);
    if (pathname === '/' || pathname === '') {
      return { type: 'redirect', to: `/spelllist${search}` };
    }
    const match = matchPath(pathname);
    if (match) {
      if (match.view === 'spellbook') {
        return { type: 'route', view: 'spellbook', spellbookId: match.spellbookId };
      }
      return { type: 'route', view: match.view };
    }
    // Unknown paths: redirect to /spelllist (F4 guardrail for future spec-specific routes)
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
    window.history.replaceState({}, '', withBase(`/spelllist${search}`));
  }

  function enter(pathname: string, search: string, mode: 'push' | 'replace') {
    const match = matchPath(pathname);
    const view = match?.view ?? 'spelllist';

    if (view === 'spelllist') {
      const effectiveSearch = search || (route.view !== 'spelllist' ? savedListSearch : '');
      applyListParams(effectiveSearch);
      savedListSearch = effectiveSearch;
      setRoute('spelllist', '/spelllist', effectiveSearch, null);
      const url = withBase(`/spelllist${effectiveSearch}`);
      if (mode === 'push') window.history.pushState({}, '', url);
      else window.history.replaceState({}, '', url);
      return;
    }

    // leaving spelllist: preserve current list params snapshot
    if (route.view === 'spelllist') {
      const params = store.toURLParams();
      savedListSearch = params.toString() ? `?${params.toString()}` : route.search;
    }

    if (view === 'spellbooks') {
      setRoute('spellbooks', '/spellbooks', '', null);
      const url = withBase('/spellbooks');
      if (mode === 'push') window.history.pushState({}, '', url);
      else window.history.replaceState({}, '', url);
      return;
    }

    if (view === 'spellbook') {
      const id = match?.spellbookId ?? '';
      if (!spellbookStore || !spellbookStore.getSpellbook(id)) {
        // Unknown/missing spellbook id -> redirect to /spelllist
        window.history.replaceState({}, '', withBase('/spelllist'));
        enter('/spelllist', '', 'replace');
        return;
      }
      spellbookStore.setActiveSpellbook(id);
      setRoute('spellbook', `/spellbooks/${id}`, '', id);
      const url = withBase(`/spellbooks/${id}`);
      if (mode === 'push') window.history.pushState({}, '', url);
      else window.history.replaceState({}, '', url);
      return;
    }
  }

  function handleLocation(mode: 'push' | 'replace') {
    const { pathname: rawPath, search } = parseUrl(window.location.pathname + window.location.search);
    const appPathname = stripBase(rawPath);
    const res = resolve(rawPath + search);
    if (res.type === 'redirect') {
      window.history.replaceState({}, '', withBase(res.to));
      const next = parseUrl(res.to);
      enter(next.pathname, next.search, 'replace');
      return;
    }
    if (res.type === 'route' && res.view === 'spellbook') {
      const id = res.spellbookId ?? '';
      if (!spellbookStore || !spellbookStore.getSpellbook(id)) {
        window.history.replaceState({}, '', withBase('/spelllist'));
        enter('/spelllist', '', 'replace');
        return;
      }
    }
    enter(appPathname, search, mode);
  }

  function navigate(path: string) {
    const { pathname, search } = parseUrl(path);
    const appPath = `${normalizePath(pathname)}${search}`;
    const res = resolve(withBase(appPath));
    if (res.type === 'redirect') {
      window.history.pushState({}, '', withBase(res.to));
      const next = parseUrl(res.to);
      enter(next.pathname, next.search, 'replace');
      return;
    }
    enter(normalizePath(pathname), search, 'push');
  }

  function handleActiveDeleted() {
    // After deleting the active spellbook, always navigate to /spellbooks (D3)
    window.history.pushState({}, '', withBase('/spellbooks'));
    enter('/spellbooks', '', 'replace');
  }

  function start() {
    if (started) return;
    started = true;
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
      window.history.replaceState({}, '', withBase('/spelllist'));
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
    onRouteChange,
    handleActiveDeleted,
  };
}
