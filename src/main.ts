import Alpine from 'alpinejs';
import { SpellStore } from './stores/spellStore';
import { AppShell } from './components/AppShell';
import { SpellTable } from './components/SpellTable';
import { FilterPanel } from './components/FilterPanel';
import { SearchBox } from './components/SearchBox';
import { createRouter } from './router/router';

const spellStore = Alpine.reactive(new SpellStore());
const router = createRouter(spellStore);
const appShell = {
  ...AppShell(),
  get route() {
    return router.route;
  },
  get isSpellListView() {
    return router.route.view === 'spelllist';
  },
  get isSpellbooksView() {
    return router.route.view === 'spellbooks';
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
