import Alpine from 'alpinejs';
import { SpellStore } from './stores/spellStore';
import { AppShell } from './components/AppShell';
import { SpellTable } from './components/SpellTable';
import { FilterPanel } from './components/FilterPanel';
import { SearchBox } from './components/SearchBox';
import { createRouter } from './router/router';

const spellStore = Alpine.reactive(new SpellStore());
const router = createRouter(spellStore, { base: import.meta.env.BASE_URL });

const routeState = Alpine.reactive({
  view: router.route.view as 'spelllist' | 'spellbooks',
  path: router.route.path,
  search: router.route.search,
});

router.onRouteChange(() => {
  routeState.view = router.route.view;
  routeState.path = router.route.path;
  routeState.search = router.route.search;
});

const appShell = {
  ...AppShell(),
  get route() {
    return routeState;
  },
  get isSpellListView() {
    return routeState.view === 'spelllist';
  },
  get isSpellbooksView() {
    return routeState.view === 'spellbooks';
  },
  clearFilters() {
    router.clearFilters();
  },
  goToSpellbooks() {
    router.navigate('/spellbooks');
  },
  goToSpellList() {
    router.navigate('/spelllist');
  },
  async init() {
    await spellStore.loadSpells();
    router.start();
  },
};

Alpine.data('app', () => appShell);

Alpine.data('spellTable', () => SpellTable(spellStore));
Alpine.data('filterPanel', () => FilterPanel(spellStore));
Alpine.data('searchBox', () => SearchBox(spellStore));

declare global {
  interface Window {
    Alpine: typeof Alpine;
    spellStore: SpellStore;
    appRouter: typeof router;
  }
}

window.Alpine = Alpine;
window.spellStore = spellStore;
window.appRouter = router;

Alpine.start();
