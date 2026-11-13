import { describe, it, expect, beforeEach } from 'vitest';
import { SpellStore } from '../stores/spellStore';

function resetEnv(url = '/') {
  window.history.replaceState({}, '', url);
}

async function loadRouter() {
  const mod = './router';
  // @vite-ignore - module intentionally missing in RED phase
  return await import(/* @vite-ignore */ mod);
}

describe('Router (Chunk 1 foundational)', () => {
  let store: SpellStore;

  beforeEach(async () => {
    resetEnv('/');
    store = new SpellStore();
    await store.loadSpells();
  });

  it('resolves "/" to redirect to "/spelllist" preserving query', async () => {
    resetEnv('/?q=fire&paths=Fire');
    const { createRouter } = await loadRouter();
    const router = createRouter(store);
    const result = router.resolve(window.location.pathname + window.location.search);
    expect(result).toEqual({ type: 'redirect', to: '/spelllist?q=fire&paths=Fire' });
  });

  it('resolves "/spelllist" with list params and applies them to store on enter', async () => {
    resetEnv('/spelllist?q=light&maintenance=daily');
    const { createRouter } = await loadRouter();
    const router = createRouter(store);
    router.start();
    expect(router.route.view).toBe('spelllist');
    expect(store.searchQuery).toBe('light');
    expect(store.filters.maintenance).toBe('daily');
  });

  it('keeps list params scoped to /spelllist and restores them on return', async () => {
    resetEnv('/spelllist?q=fire&paths=Fire');
    const { createRouter } = await loadRouter();
    const router = createRouter(store);
    router.start();
    router.navigate('/spellbooks');
    expect(window.location.pathname).toBe('/spellbooks');
    expect(window.location.search).toBe('');
    expect(router.route.view).toBe('spellbooks');
    router.navigate('/spelllist');
    expect(window.location.pathname).toBe('/spelllist');
    expect(store.searchQuery).toBe('fire');
    expect(store.filters.paths).toContain('Fire');
    expect(window.location.search).toContain('q=fire');
  });

  it('deep-links directly to /spellbooks on start', async () => {
    resetEnv('/spellbooks');
    const { createRouter } = await loadRouter();
    const router = createRouter(store);
    router.start();
    expect(router.route.view).toBe('spellbooks');
    expect(window.location.pathname).toBe('/spellbooks');
  });

  it('resolves and starts under base path /AnimaSpellBook/', async () => {
    resetEnv('/AnimaSpellBook/spelllist?q=fire');
    const { createRouter } = await loadRouter();
    const router = createRouter(store, { base: '/AnimaSpellBook/' });
    const result = router.resolve(window.location.pathname + window.location.search);
    expect(result).toEqual({ type: 'route', view: 'spelllist' });
    router.start();
    expect(router.route.view).toBe('spelllist');
    expect(store.searchQuery).toBe('fire');
  });

  it('deep-links with subset params and clears stale prior list state to defaults', async () => {
    resetEnv('/spelllist?q=fire&maintenance=daily&paths=Fire');
    const { createRouter } = await loadRouter();
    const router = createRouter(store);
    router.start();
    expect(store.searchQuery).toBe('fire');
    expect(store.filters.maintenance).toBe('daily');
    router.navigate('/spelllist?q=light');
    expect(window.location.pathname).toBe('/spelllist');
    expect(window.location.search).toBe('?q=light');
    expect(store.searchQuery).toBe('light');
    expect(store.filters.maintenance).toBe('all');
    expect(store.filters.paths).toEqual([]);
    expect(store.filters.action).toBe('all');
    expect(store.sort).toEqual({ field: 'default', direction: 'asc' });
    expect(store.columns.visible).toEqual(['name', 'path', 'level', 'effect']);
  });

  it('clear filters resets search/filter state and URL params on spelllist', async () => {
    resetEnv('/spelllist?q=fire&maintenance=daily&paths=Fire');
    const { createRouter } = await loadRouter();
    const router = createRouter(store);
    router.start();
    expect(store.searchQuery).toBe('fire');
    router.clearFilters();
    expect(store.searchQuery).toBe('');
    expect(store.filters.maintenance).toBe('all');
    expect(store.filters.paths).toEqual([]);
    expect(window.location.pathname).toBe('/spelllist');
    expect(window.location.search).toBe('');
  });
});
